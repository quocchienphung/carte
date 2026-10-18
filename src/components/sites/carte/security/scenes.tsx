"use client";

import type { ComponentType } from "react";

import type { TileId } from "@/lib/roco-bank/geometry";

import { CardAccessDemo } from "./CardAccessDemo";
import { PaymentDecisionDemo } from "./PaymentDecisionDemo";
import { PaymentRouteScene } from "./PaymentRouteScene";
import { RiskSignalsScene } from "./RiskSignalsScene";
import { SecurityAlertsDemo } from "./SecurityAlertsDemo";
import { SecurityLayersScene } from "./SecurityLayersScene";
import { VerificationDemo } from "./VerificationDemo";

/** Legacy bento tile id → Carte scene (ids kept for geometry / morph; content is new). */
export const BENTO_SCENES: Record<TileId, ComponentType> = {
  credit: CardAccessDemo,
  trust: SecurityLayersScene,
  customers: PaymentRouteScene,
  ai: RiskSignalsScene,
  easy: VerificationDemo,
  payment: PaymentDecisionDemo,
  invested: SecurityAlertsDemo,
};
