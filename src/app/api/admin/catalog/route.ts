import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTraceId, logger, startTimer } from "@/lib/logger";
import {
  INITIAL_FLOWERS,
  INITIAL_PLANS,
  PLAN_PRODUCT_VARIANTS,
  FlowerProduct,
  SubscriptionPlan,
  PlanProductVariant,
} from "@/features/catalog/types";
import { invalidateServerStoreConfigCache } from "@/features/checkout/checkout.service";

const CONFIG_KEYS = {
  FLOWERS: "FLOWERS_CATALOG",
  PLANS: "PLANS_CONFIG",
  PLAN_VARIANTS: "PLAN_VARIANTS_CONFIG",
  FESTIVE_DATES: "FESTIVE_DATES",
  STORE_SETTINGS: "STORE_SETTINGS",
  REVIEWS: "CUSTOMER_REVIEWS",
} as const;

interface PersistedStoreSettings {
  normalPurchaseAllowed: boolean;
  isFestiveManualOverride: boolean;
  festivalName: string;
}

const DEFAULT_STORE_SETTINGS: PersistedStoreSettings = {
  normalPurchaseAllowed: false, // Strictly locked for non-plan users
  isFestiveManualOverride: false,
  festivalName: "Festive Puja",
};

function safeJsonParse<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const traceId = createTraceId("CFG-GET");
  const getElapsed = startTimer();

  try {
    const rows = await db.storeConfig.findMany({
      where: {
        configKey: {
          in: Object.values(CONFIG_KEYS),
        },
      },
    });
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.configKey, r.jsonPayload));

    const flowers = safeJsonParse<FlowerProduct[]>(
      map.get(CONFIG_KEYS.FLOWERS),
      INITIAL_FLOWERS
    );
    const plans = safeJsonParse<SubscriptionPlan[]>(
      map.get(CONFIG_KEYS.PLANS),
      INITIAL_PLANS
    );
    const planVariants = safeJsonParse<PlanProductVariant[]>(
      map.get(CONFIG_KEYS.PLAN_VARIANTS),
      PLAN_PRODUCT_VARIANTS
    );
    const festiveDates = safeJsonParse<string[]>(
      map.get(CONFIG_KEYS.FESTIVE_DATES),
      []
    );
    const storeSettings = safeJsonParse<PersistedStoreSettings>(
      map.get(CONFIG_KEYS.STORE_SETTINGS),
      DEFAULT_STORE_SETTINGS
    );
    const reviews = safeJsonParse<unknown[]>(
      map.get(CONFIG_KEYS.REVIEWS),
      []
    );

    return NextResponse.json({
      success: true,
      traceId,
      durationMs: getElapsed(),
      flowers,
      plans,
      planVariants,
      festiveDates,
      storeSettings: {
        ...storeSettings,
        normalPurchaseAllowed: false,
      },
      reviews,
    });
  } catch (err) {
    logger.warn({
      module: "CATALOG",
      action: "STORE_CONFIG_FALLBACK_TO_DEFAULTS",
      traceId,
      durationMs: getElapsed(),
      message: "Returning default catalog & 7 plan variants.",
      meta: { err: String(err) },
    });

    return NextResponse.json({
      success: true,
      traceId,
      fallback: true,
      flowers: INITIAL_FLOWERS,
      plans: INITIAL_PLANS,
      planVariants: PLAN_PRODUCT_VARIANTS,
      festiveDates: [],
      storeSettings: DEFAULT_STORE_SETTINGS,
      reviews: [],
    });
  }
}

export async function POST(req: NextRequest) {
  const traceId = createTraceId("CFG-SAVE");
  const getElapsed = startTimer();

  try {
    const body = await req.json();
    const updatedKeys: string[] = [];

    if (Array.isArray(body.flowers) && body.flowers.length > 0) {
      await db.storeConfig.upsert({
        where: { configKey: CONFIG_KEYS.FLOWERS },
        update: { jsonPayload: JSON.stringify(body.flowers) },
        create: {
          configKey: CONFIG_KEYS.FLOWERS,
          jsonPayload: JSON.stringify(body.flowers),
        },
      });
      updatedKeys.push(CONFIG_KEYS.FLOWERS);
    }

    if (Array.isArray(body.plans) && body.plans.length > 0) {
      await db.storeConfig.upsert({
        where: { configKey: CONFIG_KEYS.PLANS },
        update: { jsonPayload: JSON.stringify(body.plans) },
        create: {
          configKey: CONFIG_KEYS.PLANS,
          jsonPayload: JSON.stringify(body.plans),
        },
      });
      updatedKeys.push(CONFIG_KEYS.PLANS);
    }

    if (Array.isArray(body.planVariants) && body.planVariants.length > 0) {
      await db.storeConfig.upsert({
        where: { configKey: CONFIG_KEYS.PLAN_VARIANTS },
        update: { jsonPayload: JSON.stringify(body.planVariants) },
        create: {
          configKey: CONFIG_KEYS.PLAN_VARIANTS,
          jsonPayload: JSON.stringify(body.planVariants),
        },
      });
      updatedKeys.push(CONFIG_KEYS.PLAN_VARIANTS);
    }

    if (Array.isArray(body.festiveDates)) {
      await db.storeConfig.upsert({
        where: { configKey: CONFIG_KEYS.FESTIVE_DATES },
        update: { jsonPayload: JSON.stringify(body.festiveDates) },
        create: {
          configKey: CONFIG_KEYS.FESTIVE_DATES,
          jsonPayload: JSON.stringify(body.festiveDates),
        },
      });
      updatedKeys.push(CONFIG_KEYS.FESTIVE_DATES);
    }

    if (Array.isArray(body.reviews)) {
      await db.storeConfig.upsert({
        where: { configKey: CONFIG_KEYS.REVIEWS },
        update: { jsonPayload: JSON.stringify(body.reviews) },
        create: {
          configKey: CONFIG_KEYS.REVIEWS,
          jsonPayload: JSON.stringify(body.reviews),
        },
      });
      updatedKeys.push(CONFIG_KEYS.REVIEWS);
    }

    // Immediately bust the 60s server checkout cache so new prices take effect instantly
    invalidateServerStoreConfigCache();

    logger.info({
      module: "ADMIN_DASHBOARD",
      action: "STORE_CONFIG_SAVED_IN_MYSQL",
      traceId,
      durationMs: getElapsed(),
      message: `Saved StoreConfig keys in Hostinger MySQL: ${updatedKeys.join(
        ", "
      )}`,
    });

    return NextResponse.json({
      success: true,
      traceId,
      updatedKeys,
    });
  } catch (err) {
    logger.error(
      {
        module: "ADMIN_DASHBOARD",
        action: "STORE_CONFIG_SAVE_ERROR",
        traceId,
        durationMs: getElapsed(),
        message: "Failed to persist StoreConfig in Hostinger MySQL",
      },
      err
    );
    return NextResponse.json(
      {
        success: false,
        traceId,
        error: "Database error while saving store configuration.",
      },
      { status: 500 }
    );
  }
}