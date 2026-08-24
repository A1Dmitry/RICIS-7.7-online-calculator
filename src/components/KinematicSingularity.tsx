/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KinematicState } from '../types';
import { useLanguage } from '../lib/i18n';
import { 
  Cpu, Shield, Zap, AlertTriangle, ArrowRight, CheckCircle2, 
  History, RotateCcw, Activity, Compass, Sliders, 
  CheckSquare, RefreshCw, Play, Info, Lock, XCircle, ArrowUpRight, Scale
} from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';
import Latex, { FormattedMessage } from './Latex';

interface KinematicSingularityProps {
  preset?: KinematicState;
  onChangeState?: (state: KinematicState) => void;
}

export interface SingularHistoryLog {
  id: string;
  timestamp: string;
  angle1: number;
  angle2: number;
  detJ: number;
  typedOrigin: string;
  rank: number;
  condNumber: number;
  sigmaMin: number;
  lostDir: [number, number];
  preservedDir: [number, number];
  recoveryConstraint: string;
  checkpoint: { angle1: number; angle2: number; detJ: number; isValid: boolean };
}

export default function KinematicSingularity({ preset, onChangeState }: KinematicSingularityProps = {}) {
  const { language, t } = useLanguage();
  const [state, setState] = useState<KinematicState>({
    angle1: 45,        // theta_1 degrees
    angle2: 2,         // theta_2 degrees (near singularity theta_2 = 0)
    length1: 100,      // link 1 length px
    length2: 80,       // link 2 length px
    targetVx: 20,      // desired end-effector velocity x
    targetVy: -10,     // desired end-effector velocity y
    damping: 0.15      // RICIS lambda parameter
  });

  // Additional RICIS Control & Checkpoint States
  const [adaptiveLambda, setAdaptiveLambda] = useState<boolean>(true);
  const [useTaskSpaceConstraint, setUseTaskSpaceConstraint] = useState<boolean>(true);
  const [useNullSpaceRecovery, setUseNullSpaceRecovery] = useState<boolean>(true);
  const [checkpoint, setCheckpoint] = useState<{ angle1: number; angle2: number }>({
    angle1: 45,
    angle2: 45
  });
  
  // Historian log of singular events
  const [historianLogs, setHistorianLogs] = useState<SingularHistoryLog[]>([]);
  const [activeTestStep, setActiveTestStep] = useState<number>(0);

  useEffect(() => {
    if (preset) {
      setState(prev => ({ ...prev, ...preset }));
    }
  }, [preset]);

  const lastSentStateRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized !== lastSentStateRef.current) {
      lastSentStateRef.current = serialized;
      onChangeState?.(state);
    }
  }, [state, onChangeState]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper conversions
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const deg = (r: number) => (r * 180) / Math.PI;

  const th1 = rad(state.angle1);
  const th2 = rad(state.angle2);
  const L1 = state.length1;
  const L2 = state.length2;
  const vx = state.targetVx;
  const vy = state.targetVy;

  // 1. Forward Kinematics
  const elbx = L1 * Math.cos(th1);
  const elby = L1 * Math.sin(th1);
  const eex = elbx + L2 * Math.cos(th1 + th2);
  const eey = elby + L2 * Math.sin(th1 + th2);

  // 2. Jacobian Matrix
  const J11 = -L1 * Math.sin(th1) - L2 * Math.sin(th1 + th2);
  const J12 = -L2 * Math.sin(th1 + th2);
  const J21 = L1 * Math.cos(th1) + L2 * Math.cos(th1 + th2);
  const J22 = L2 * Math.cos(th1 + th2);

  // Determinant: det(J) = L1 * L2 * sin(theta_2)
  const detJ = L1 * L2 * Math.sin(th2);
  const manipulability = Math.abs(detJ);

  // 3. SVD / Eigenvalues of J * J^T
  const E = J11 * J11 + J12 * J12;
  const F = J11 * J21 + J12 * J22;
  const G = J21 * J21 + J22 * J22;

  const trace = E + G;
  const det_JJT = E * G - F * F;
  const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * det_JJT));
  const eig1 = (trace + discriminant) / 2;
  const eig2 = (trace - discriminant) / 2;

  const sigma1 = Math.sqrt(Math.max(0, eig1)); // Semi-major axis (sigma_max)
  const sigma2 = Math.sqrt(Math.max(0, eig2)); // Semi-minor axis (sigma_min)

  const ellipseAngle = 0.5 * Math.atan2(2 * F, E - G);

  // Rank and Kernel calculation
  const isSingular = manipulability < 200;
  const rankJ = isSingular ? 1 : 2;
  const dimKerJ = 2 - rankJ;

  // Kernel Basis vector (joint space)
  // When theta_2 = 0, J * [1, -(1 + L1/L2)]^T = 0
  const kerRatio = -(1 + L1 / L2);
  const kerNorm = Math.sqrt(1 + kerRatio * kerRatio);
  const kerBasis: [number, number] = isSingular 
    ? [1 / kerNorm, kerRatio / kerNorm] 
    : [0, 0];

  // Condition Number
  const condNumber = sigma2 > 1e-6 ? sigma1 / sigma2 : Infinity;

  // Task-Space Preserved & Lost Directions
  // Preserved direction u_1 corresponds to sigma_max (orthogonal to extended arm)
  const u_preserved: [number, number] = [Math.cos(ellipseAngle), Math.sin(ellipseAngle)];
  // Lost direction u_2 corresponds to sigma_min (along extended arm)
  const u_lost: [number, number] = [-Math.sin(ellipseAngle), Math.cos(ellipseAngle)];

  // Dynamic Adaptive Lambda Rule: lambda = f(S(q_s))
  // When sigma_min decreases, lambda increases automatically according to RICIS signature
  const calculatedLambda = useMemo(() => {
    if (!adaptiveLambda) return state.damping;
    const sigmaThresh = 15.0;
    if (sigma2 >= sigmaThresh) return 0.01;
    // Adaptive smooth profile
    const alpha = 1.0 - (sigma2 / sigmaThresh);
    return Math.min(0.4, 0.01 + 0.35 * Math.pow(alpha, 2));
  }, [adaptiveLambda, state.damping, sigma2]);

  // Actual lambda used for controller equations
  const effectiveLambda = calculatedLambda;

  // 4. Task-Space Recovery Constraint
  // Target velocity projection onto Preserved vs Lost direction
  const v_dot_preserved = vx * u_preserved[0] + vy * u_preserved[1];
  const v_dot_lost = vx * u_lost[0] + vy * u_lost[1];

  const v_preserved_proj: [number, number] = [
    v_dot_preserved * u_preserved[0],
    v_dot_preserved * u_preserved[1]
  ];
  const v_lost_proj: [number, number] = [
    v_dot_lost * u_lost[0],
    v_dot_lost * u_lost[1]
  ];

  // RICIS Task-Space Constrained Target Velocity
  const v_ricis_target: [number, number] = (useTaskSpaceConstraint && isSingular)
    ? v_preserved_proj
    : [vx, vy];

  // 5. Damped Least Squares (DLS) & Null-Space Computation
  const lam2 = effectiveLambda * effectiveLambda;
  const A11 = E + lam2;
  const A12 = F;
  const A21 = F;
  const A22 = G + lam2;
  const detA = A11 * A22 - A12 * A21;

  // Inverse matrix A^(-1)
  const A_inv11 = detA > 1e-9 ? A22 / detA : 0;
  const A_inv12 = detA > 1e-9 ? -A12 / detA : 0;
  const A_inv21 = detA > 1e-9 ? -A21 / detA : 0;
  const A_inv22 = detA > 1e-9 ? A11 / detA : 0;

  // DLS Pseudoinverse J_star = J^T * A_inv
  const J_star11 = J11 * A_inv11 + J21 * A_inv21;
  const J_star12 = J11 * A_inv12 + J21 * A_inv22;
  const J_star21 = J12 * A_inv11 + J22 * A_inv21;
  const J_star22 = J12 * A_inv12 + J22 * A_inv22;

  // Classical DLS Joint Velocities (without task-space constraint or null-space escape)
  const classicalJointVel1 = J_star11 * vx + J_star12 * vy;
  const classicalJointVel2 = J_star21 * vx + J_star22 * vy;

  // Un-damped Analytical Inverse Velocities (for raw singularity blow-up check)
  let rawJointVel1 = 0;
  let rawJointVel2 = 0;
  if (Math.abs(detJ) > 1e-4) {
    rawJointVel1 = (J22 * vx - J12 * vy) / detJ;
    rawJointVel2 = (-J21 * vx + J11 * vy) / detJ;
  } else {
    rawJointVel1 = Infinity;
    rawJointVel2 = Infinity;
  }

  // Null-Space Recovery Projection: N = I - J_star * J
  const P11 = J_star11 * J11 + J_star12 * J21;
  const P12 = J_star11 * J12 + J_star12 * J22;
  const P21 = J_star21 * J11 + J_star22 * J21;
  const P22 = J_star21 * J12 + J_star22 * J22;

  const N11 = 1 - P11;
  const N12 = -P12;
  const N21 = -P21;
  const N22 = 1 - P22;

  // Gradient to escape towards Checkpoint q_c
  const deltaTh1 = rad(checkpoint.angle1) - th1;
  const deltaTh2 = rad(checkpoint.angle2) - th2;
  const kRecovery = 1.5;

  const escapeSpeed1 = kRecovery * deltaTh1;
  const escapeSpeed2 = kRecovery * deltaTh2;

  // Null-space recovery joint velocity
  const nullVel1 = useNullSpaceRecovery ? (N11 * escapeSpeed1 + N12 * escapeSpeed2) : 0;
  const nullVel2 = useNullSpaceRecovery ? (N21 * escapeSpeed1 + N22 * escapeSpeed2) : 0;

  // RICIS-Informed Joint Velocities: J_star * v_ricis_target + q_dot_null
  const ricisJointVel1 = (J_star11 * v_ricis_target[0] + J_star12 * v_ricis_target[1]) + nullVel1;
  const ricisJointVel2 = (J_star21 * v_ricis_target[0] + J_star22 * v_ricis_target[1]) + nullVel2;

  // Achieved velocities for RICIS
  const ricis_vx_achieved = J11 * ricisJointVel1 + J12 * ricisJointVel2;
  const ricis_vy_achieved = J21 * ricisJointVel1 + J22 * ricisJointVel2;

  const ricisErrorX = vx - ricis_vx_achieved;
  const ricisErrorY = vy - ricis_vy_achieved;
  const ricisTrackingError = Math.sqrt(ricisErrorX * ricisErrorX + ricisErrorY * ricisErrorY);

  // Checkpoint J(q_c) validation
  const detJ_checkpoint = L1 * L2 * Math.sin(rad(checkpoint.angle2));
  const isCheckpointValid = Math.abs(detJ_checkpoint) > 500;

  // Auto-log to Historian when entering near-singular state
  const lastLoggedAngle2Ref = useRef<number>(999);
  useEffect(() => {
    if (isSingular && Math.abs(state.angle2 - lastLoggedAngle2Ref.current) > 1) {
      lastLoggedAngle2Ref.current = state.angle2;
      const newLog: SingularHistoryLog = {
        id: `LOG_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        angle1: state.angle1,
        angle2: state.angle2,
        detJ: detJ,
        typedOrigin: `0_{\{det J(q_s)\}} = 0_{(L_1 L_2 \\sin(${state.angle2}°))}`,
        rank: rankJ,
        condNumber: condNumber,
        sigmaMin: sigma2,
        lostDir: [parseFloat(u_lost[0].toFixed(3)), parseFloat(u_lost[1].toFixed(3))],
        preservedDir: [parseFloat(u_preserved[0].toFixed(3)), parseFloat(u_preserved[1].toFixed(3))],
        recoveryConstraint: useTaskSpaceConstraint 
          ? `P_{range} (v_{target} \\to v_{preserved}) + NullSpace(q_c)` 
          : `None (Unconstrained Classical DLS)`,
        checkpoint: {
          angle1: checkpoint.angle1,
          angle2: checkpoint.angle2,
          detJ: detJ_checkpoint,
          isValid: isCheckpointValid
        }
      };

      setHistorianLogs(prev => [newLog, ...prev.slice(0, 19)]); // keep last 20 logs
    }
  }, [state.angle1, state.angle2, detJ, isSingular, rankJ, condNumber, sigma2, u_lost, u_preserved, useTaskSpaceConstraint, checkpoint, detJ_checkpoint, isCheckpointValid]);

  // Rollback function
  const rollbackToCheckpoint = () => {
    setState(prev => ({
      ...prev,
      angle1: checkpoint.angle1,
      angle2: checkpoint.angle2
    }));
  };

  // Test sequence handler
  const executeTestStep = (stepNum: number) => {
    setActiveTestStep(stepNum);
    switch (stepNum) {
      case 1: // Approach theta_2 = 0
        setState(prev => ({ ...prev, angle1: 45, angle2: 2, targetVx: 20, targetVy: -10 }));
        break;
      case 2: // Move in preserved direction
        setState(prev => ({ 
          ...prev, 
          angle1: 45, 
          angle2: 0, 
          targetVx: Math.round(30 * u_preserved[0]), 
          targetVy: Math.round(30 * u_preserved[1]) 
        }));
        break;
      case 3: // Move in lost direction
        setState(prev => ({ 
          ...prev, 
          angle1: 45, 
          angle2: 0, 
          targetVx: Math.round(30 * u_lost[0]), 
          targetVy: Math.round(30 * u_lost[1]) 
        }));
        break;
      case 4: // Compare DLS vs RICIS
        setAdaptiveLambda(true);
        setUseTaskSpaceConstraint(true);
        setUseNullSpaceRecovery(true);
        break;
      case 5: // Rollback to q_c
        rollbackToCheckpoint();
        break;
      case 6: // Check q_c
        // Verified automatically in UI
        break;
      case 7: // Re-approach
        setState(prev => ({ ...prev, angle1: 30, angle2: -2, targetVx: -15, targetVy: 25 }));
        break;
      default:
        break;
    }
  };

  // Redraw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const base_X = width / 2;
    const base_Y = height / 2 + 30;

    // Coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base_Y);
    ctx.lineTo(width, base_Y);
    ctx.moveTo(base_X, 0);
    ctx.lineTo(base_X, height);
    ctx.stroke();

    // Robot link positions
    const elb_pixel_X = base_X + elbx;
    const elb_pixel_Y = base_Y - elby;
    const ee_pixel_X = base_X + eex;
    const ee_pixel_Y = base_Y - eey;

    // 1. Extended arm ray / singularity axis line
    if (isSingular) {
      ctx.beginPath();
      ctx.moveTo(base_X, base_Y);
      const extX = base_X + 2.5 * eex;
      const extY = base_Y - 2.5 * eey;
      ctx.lineTo(extX, extY);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Manipulability Ellipsoid
    if (sigma1 > 0.1) {
      ctx.save();
      ctx.translate(ee_pixel_X, ee_pixel_Y);
      ctx.rotate(-ellipseAngle);

      const scaleEllipse = 0.15;
      ctx.beginPath();
      ctx.ellipse(0, 0, sigma1 * scaleEllipse, Math.max(1, sigma2 * scaleEllipse), 0, 0, 2 * Math.PI);
      ctx.fillStyle = isSingular ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 211, 238, 0.05)';
      ctx.fill();

      ctx.strokeStyle = isSingular ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Task-Space Directions at End-Effector
    const scaleVec = 1.5;

    // Preserved Direction Vector (Emerald)
    const endPresX = ee_pixel_X + u_preserved[0] * 35;
    const endPresY = ee_pixel_Y - u_preserved[1] * 35;
    ctx.beginPath();
    ctx.moveTo(ee_pixel_X, ee_pixel_Y);
    ctx.lineTo(endPresX, endPresY);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '9px monospace';
    ctx.fillText('u_pres', endPresX + 4, endPresY - 2);

    // Lost Direction Vector (Rose/Red)
    const endLostX = ee_pixel_X + u_lost[0] * 35;
    const endLostY = ee_pixel_Y - u_lost[1] * 35;
    ctx.beginPath();
    ctx.moveTo(ee_pixel_X, ee_pixel_Y);
    ctx.lineTo(endLostX, endLostY);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f43f5e';
    ctx.font = '9px monospace';
    ctx.fillText('u_lost', endLostX + 4, endLostY - 2);

    // Target Velocity Vector (Cyan)
    const endVecX = ee_pixel_X + vx * scaleVec;
    const endVecY = ee_pixel_Y - vy * scaleVec;
    ctx.beginPath();
    ctx.moveTo(ee_pixel_X, ee_pixel_Y);
    ctx.lineTo(endVecX, endVecY);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Target vector arrow head
    const angleVec = Math.atan2(endVecY - ee_pixel_Y, endVecX - ee_pixel_X);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(endVecX, endVecY);
    ctx.lineTo(endVecX - 7 * Math.cos(angleVec - Math.PI/6), endVecY - 7 * Math.sin(angleVec - Math.PI/6));
    ctx.lineTo(endVecX - 7 * Math.cos(angleVec + Math.PI/6), endVecY - 7 * Math.sin(angleVec + Math.PI/6));
    ctx.fill();
    ctx.font = '10px monospace';
    ctx.fillText('v_target', endVecX + 5, endVecY - 5);

    // RICIS Constrained Target Vector (Amber, if different)
    if (useTaskSpaceConstraint && isSingular) {
      const endRicisX = ee_pixel_X + v_ricis_target[0] * scaleVec;
      const endRicisY = ee_pixel_Y - v_ricis_target[1] * scaleVec;
      ctx.beginPath();
      ctx.moveTo(ee_pixel_X, ee_pixel_Y);
      ctx.lineTo(endRicisX, endRicisY);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px monospace';
      ctx.fillText('v_ricis', endRicisX + 5, endRicisY + 10);
    }

    // 4. Arm Links
    // Link 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(base_X, base_Y);
    ctx.lineTo(elb_pixel_X, elb_pixel_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(base_X, base_Y);
    ctx.lineTo(elb_pixel_X, elb_pixel_Y);
    ctx.stroke();

    // Link 2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(elb_pixel_X, elb_pixel_Y);
    ctx.lineTo(ee_pixel_X, ee_pixel_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(elb_pixel_X, elb_pixel_Y);
    ctx.lineTo(ee_pixel_X, ee_pixel_Y);
    ctx.stroke();

    // Joints
    // Base
    ctx.beginPath();
    ctx.arc(base_X, base_Y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Elbow
    ctx.beginPath();
    ctx.arc(elb_pixel_X, elb_pixel_Y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = isSingular ? '#ef4444' : '#22d3ee';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // End Effector
    ctx.beginPath();
    ctx.arc(ee_pixel_X, ee_pixel_Y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

  }, [state, elbx, elby, eex, eey, vx, vy, sigma1, sigma2, ellipseAngle, isSingular, u_preserved, u_lost, v_ricis_target, useTaskSpaceConstraint]);

  const targetMag = Math.sqrt(vx * vx + vy * vy);
  const accuracyPercent = targetMag > 0.01 
    ? Math.max(0, Math.min(100, (1 - ricisTrackingError / targetMag) * 100))
    : 100;

  return (
    <div id="kinematic-root" className="space-y-6 text-slate-300">
      
      {/* Test Sequence Interactive Bar */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg">
            <Play className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              {t('Тестовая последовательность RICIS-III (7 Шагов)', 'RICIS-III Test Sequence (7 Steps)')}
              {activeTestStep > 0 && (
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {t('Шаг', 'Step')} {activeTestStep}/7
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {t('Пошаговая методологическая проверка: от сингулярности $\\theta_2 \\to 0$ до вычисления Recovery Constraint и отката', 'Step-by-step methodological verification: from singularity $\\theta_2 \\to 0$ to computing Recovery Constraint and rollback')}
            </p>
          </div>
        </div>

        {/* Step Buttons */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { step: 1, label: t('1. Подход θ₂=2°', '1. Approach θ₂=2°') },
            { step: 2, label: t('2. v ∈ Preserved', '2. v ∈ Preserved') },
            { step: 3, label: t('3. v ∈ Lost', '3. v ∈ Lost') },
            { step: 4, label: t('4. DLS vs RICIS', '4. DLS vs RICIS') },
            { step: 5, label: t('5. Откат к q_c', '5. Rollback to q_c') },
            { step: 6, label: t('6. Проверка q_c', '6. Verify q_c') },
            { step: 7, label: t('7. Новый подход', '7. Re-approach') }
          ].map(btn => (
            <button
              key={btn.step}
              type="button"
              onClick={() => executeTestStep(btn.step)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition cursor-pointer border ${
                activeTestStep === btn.step
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Simulation & Detailed Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Canvas & Typed Origin Analytics */}
        <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
                  {t('Манипулятор RICIS-III Control Engine', 'RICIS-III Manipulator Control Engine')}
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3 h-3 text-cyan-400" />
                {adaptiveLambda ? t('Адаптивный λ = f(S)', 'Adaptive λ = f(S)') : t('Фиксированный λ', 'Fixed λ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('Визуализация подпространств скоростей: зеленая стрелка — ', 'Velocity subspace visualization: green arrow — ')}<span className="text-emerald-400 font-semibold">{t('сохраненное направление', 'preserved direction')} (<Latex math="u_{\text{preserved}}" />)</span>{t(', красная пунктирная — ', ', red dashed — ')}<span className="text-rose-400 font-semibold">{t('потерянное направление', 'lost direction')} (<Latex math="u_{\text{lost}}" />)</span>.
            </p>
          </div>

          {/* Canvas Display */}
          <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#09090B] flex items-center justify-center p-2">
            <canvas 
              ref={canvasRef} 
              width={420} 
              height={290} 
              className="w-full h-auto max-h-[290px] rounded block"
            />

            {/* Canvas overlay alerts */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
              {isSingular && (
                <div className="bg-red-950/90 border border-red-500/40 text-red-200 text-[10px] font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{t('0_{det J(q_s)}: Сингулярность активна!', '0_{det J(q_s)}: Singularity Active!')}</span>
                </div>
              )}
              {Math.abs(rawJointVel1) > 2.0 && !adaptiveLambda && (
                <div className="bg-rose-950/90 border border-rose-500/40 text-rose-200 text-[10px] font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-bounce">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t('Классический DLS: Взрыв скоростей q̇!', 'Classical DLS: Velocity Explosion q̇!')}</span>
                </div>
              )}
              {useTaskSpaceConstraint && isSingular && (
                <div className="bg-amber-950/90 border border-amber-500/40 text-amber-200 text-[10px] font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t('RICIS Recovery Constraint Активен', 'RICIS Recovery Constraint Active')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed RICIS Mathematical Signatures Grid */}
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-2 flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                1. Typified Origin & Subspace Signature
              </span>
              <span className="text-[10px] font-mono text-slate-500">RICIS-III Axiom Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Typed Origin Expression */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  1. Typed Origin Expression
                </span>
                <div className="text-sm font-mono text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-500/20 text-center">
                  <Latex math={`0_{\\{det J(q_s)\\}} = 0_{(${L1}\\cdot${L2}\\cdot\\sin(${state.angle2}^\\circ))}`} />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {t('Сохраняет информацию о порождающем выражении $L_1 L_2 \\sin(\\theta_2)$ в точке $\\theta_2 = ', 'Preserves information of generating expression $L_1 L_2 \\sin(\\theta_2)$ at point $\\theta_2 = ')}{state.angle2}°.
                </p>
              </div>

              {/* Rank & Kernel Basis */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  2. Rank and Kernel ({t('Ядро J', 'Kernel J')})
                </span>
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-slate-400">rank(J): <strong className="text-white">{rankJ}</strong></span>
                  <span className="text-slate-400">dim(ker J): <strong className="text-amber-400">{dimKerJ}</strong></span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-white/5 p-1.5 rounded border border-white/5 text-center">
                  {isSingular ? (
                    <Latex math={`\\ker(J) = \\text{span}\\begin{pmatrix} 1 \\\\ ${kerBasis[1].toFixed(2)} \\end{pmatrix}`} />
                  ) : (
                    <span className="text-slate-500">ker(J) = &#123;0&#125; ({t('Полный ранг', 'Full Rank')})</span>
                  )}
                </div>
              </div>

              {/* Singular Values & Condition Number */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  3. Singular Value & Condition
                </span>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div className="bg-white/5 p-1 rounded">
                    <span className="text-[9px] text-slate-500 block">σ_max</span>
                    <span className="text-emerald-400 font-bold">{sigma1.toFixed(1)}</span>
                  </div>
                  <div className="bg-white/5 p-1 rounded">
                    <span className="text-[9px] text-slate-500 block">σ_min</span>
                    <span className={isSingular ? 'text-red-400 font-bold animate-pulse' : 'text-cyan-400'}>{sigma2.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/5 p-1 rounded">
                    <span className="text-[9px] text-slate-500 block">κ(J)</span>
                    <span className="text-amber-400 font-bold">{condNumber === Infinity ? '∞' : condNumber.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  {condNumber === Infinity ? t('Сингулярное число стремится к бесконечности ∞_{(1/0)}', 'Condition number approaches infinity ∞_{(1/0)}') : `${t('Число обусловленности:', 'Condition number:')} ${condNumber.toFixed(1)}`}
                </p>
              </div>

              {/* Task-Space Lost & Preserved Directions */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                  4. Lost & Preserved Directions
                </span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/20">
                    <span>u_preserved ({t('Доступно', 'Available')}):</span>
                    <span>[{u_preserved[0].toFixed(2)}, {u_preserved[1].toFixed(2)}]</span>
                  </div>
                  <div className="flex justify-between text-rose-400 bg-rose-950/20 px-2 py-1 rounded border border-rose-500/20">
                    <span>u_lost ({t('Потеряно', 'Lost')}):</span>
                    <span>[{u_lost[0].toFixed(2)}, {u_lost[1].toFixed(2)}]</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Controls, Lambda Selection & Checkpoint */}
        <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">
                {t('Управление и параметры', 'Controls & Parameters')}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('Суставы, векторы скоростей и контроллеры RICIS', 'Joints, velocity vectors, and RICIS controllers')}
              </p>
            </div>

            {/* Sliders for Joint Angles */}
            <div className="space-y-3 bg-[#09090B] p-3.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">
                {t('Конфигурация суставов', 'Joint Configuration')}
              </span>
              
              {/* Angle 1 slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-mono text-[10px]">
                    {t('Плечевой сустав (θ₁)', 'Shoulder Joint (θ₁)')}
                  </label>
                  <span className="font-mono text-white bg-white/5 border border-white/10 px-2 py-0.5 text-xs rounded">{state.angle1}°</span>
                </div>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="1" 
                  value={state.angle1}
                  onChange={(e) => setState({...state, angle1: parseInt(e.target.value)})}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Angle 2 slider (elbow) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-mono text-[10px]">
                    {t('Локтевой сустав (θ₂)', 'Elbow Joint (θ₂)')}
                  </label>
                  <span className={`font-mono px-2 py-0.5 text-xs rounded border ${
                    Math.abs(state.angle2) < 5 
                      ? 'text-red-400 bg-red-950/30 border-red-500/40 font-bold animate-pulse' 
                      : 'text-white bg-white/5 border-white/10'
                  }`}>{state.angle2}°</span>
                </div>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="1" 
                  value={state.angle2}
                  onChange={(e) => setState({...state, angle2: parseInt(e.target.value)})}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Sliders for Target Velocities */}
            <div className="space-y-3 bg-[#09090B] p-3.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">
                {t('Целевой вектор скорости v_target', 'Target Velocity Vector v_target')}
              </span>
              
              {/* Velocity Target vector x */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-mono text-[10px]">
                    {t('Скорость V_x', 'Velocity V_x')}
                  </label>
                  <span className="font-mono text-white bg-white/5 border border-white/10 px-2 py-0.5 text-xs rounded">
                    {state.targetVx} {t('м/с', 'm/s')}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-40" 
                  max="40" 
                  step="1" 
                  value={state.targetVx}
                  onChange={(e) => setState({...state, targetVx: parseInt(e.target.value)})}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Velocity Target vector y */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-400 font-mono text-[10px]">
                    {t('Скорость V_y', 'Velocity V_y')}
                  </label>
                  <span className="font-mono text-white bg-white/5 border border-white/10 px-2 py-0.5 text-xs rounded">
                    {state.targetVy} {t('м/с', 'm/s')}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-40" 
                  max="40" 
                  step="1" 
                  value={state.targetVy}
                  onChange={(e) => setState({...state, targetVy: parseInt(e.target.value)})}
                  className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* 5. Lambda Selection Rule Panel */}
            <div className="bg-[#09090B] p-3.5 rounded-lg border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-mono uppercase font-semibold block">
                  5. {t('Правило выбора', 'Selection Rule')} λ = f(S(q_s))
                </span>
                <button
                  type="button"
                  onClick={() => setAdaptiveLambda(!adaptiveLambda)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer transition ${
                    adaptiveLambda 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {adaptiveLambda ? t('Адаптивный RICIS', 'Adaptive RICIS') : t('Ручной Слайдер', 'Manual Slider')}
                </button>
              </div>

              {adaptiveLambda ? (
                <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">{t('Формула:', 'Formula:')}</span>
                    <span className="text-cyan-300"><Latex math="\lambda(q) = \lambda_0 + \alpha(1 - \sigma_{min}/\sigma_{th})^2" /></span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">{t('Текущий вычисленный λ:', 'Currently computed λ:')}</span>
                    <span className="text-cyan-400 font-bold">{effectiveLambda.toFixed(3)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-400 font-mono text-[10px]">{t('Фиксированный Демпфер (λ)', 'Fixed Damping (λ)')}</label>
                    <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 text-xs rounded">
                      {state.damping.toFixed(2)}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="0.5" 
                    step="0.01" 
                    value={state.damping}
                    onChange={(e) => setState({...state, damping: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* 6. Recovery Constraints & Toggles */}
            <div className="bg-[#09090B] p-3.5 rounded-lg border border-white/5 space-y-2">
              <span className="text-[10px] text-amber-400 font-mono uppercase font-semibold block">
                6. Recovery Constraints ({t('Ограничения Управления', 'Control Constraints')})
              </span>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useTaskSpaceConstraint}
                  onChange={(e) => setUseTaskSpaceConstraint(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                />
                <span>{t('Проекция на доступное подпространство', 'Projection onto available subspace')} <Latex math="P_{\text{range}} v_{\text{target}}" /></span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useNullSpaceRecovery}
                  onChange={(e) => setUseNullSpaceRecovery(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer"
                />
                <span>{t('Увод в ядре Якобиана к Checkpoint', 'Null-space divergence toward Checkpoint')} <Latex math="q_c" /> (<Latex math="(I - J^\dagger J) \dot{q}_{\text{escape}}" />)</span>
              </label>
            </div>

            {/* 9. Checkpoint q_c Configuration & Physical Non-Singularity Validation */}
            <div className="bg-[#09090B] p-3.5 rounded-lg border border-white/5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-emerald-400 font-mono uppercase font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  9. Checkpoint q_c Validation
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isCheckpointValid 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                    : 'bg-red-950/40 text-red-300 border-red-500/30'
                }`}>
                  {isCheckpointValid ? `VALID: det J = ${detJ_checkpoint.toFixed(1)} ≠ 0` : t('INVALID (Сингулярно)', 'INVALID (Singular)')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block">{t('θ1_c (Плечо)', 'θ1_c (Shoulder)')}</span>
                  <input 
                    type="number"
                    value={checkpoint.angle1}
                    onChange={(e) => setCheckpoint({ ...checkpoint, angle1: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">{t('θ2_c (Локоть)', 'θ2_c (Elbow)')}</span>
                  <input 
                    type="number"
                    value={checkpoint.angle2}
                    onChange={(e) => setCheckpoint({ ...checkpoint, angle2: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs mt-0.5"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={rollbackToCheckpoint}
                className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 rounded font-mono text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('Откат к Checkpoint q_c (История сохраняется)', 'Rollback to Checkpoint q_c (History preserved)')}</span>
              </button>
            </div>

          </div>

          <ExportToSheetsButton 
            mode="KINEMATIC" 
            params={state} 
            defaultDescription={`RICIS Kinematics: angles=(${state.angle1}, ${state.angle2}), lambda=${effectiveLambda.toFixed(3)}`} 
          />
        </div>

      </div>

      {/* 7. Side-by-Side Controller Comparison: Classical DLS vs RICIS-Informed */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
              7. {t('Сравнение Управления: Classical DLS vs. RICIS-Informed DLS', 'Controller Comparison: Classical DLS vs. RICIS-Informed DLS')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {t('Прямой ответ рецензенту: как RICIS формирует Recovery Constraint', 'Direct response to reviewer: how RICIS forms Recovery Constraint')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          
          {/* Classical DLS Box */}
          <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-bold text-slate-300 uppercase">{t('Классический DLS', 'Classical DLS')}</span>
              <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{t('Простая Диагностика', 'Simple Diagnostics')}</span>
            </div>

            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>{t('Скорость q̇₁:', 'Velocity q̇₁:')}</span>
                <strong className={Math.abs(classicalJointVel1) > 2 ? 'text-rose-400 font-bold' : 'text-white'}>
                  {classicalJointVel1.toFixed(3)} {t('рад/с', 'rad/s')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>{t('Скорость q̇₂:', 'Velocity q̇₂:')}</span>
                <strong className={Math.abs(classicalJointVel2) > 2 ? 'text-rose-400 font-bold' : 'text-white'}>
                  {classicalJointVel2.toFixed(3)} {t('рад/с', 'rad/s')}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5 text-[10px]">
                <span>constraint_classical:</span>
                <span className="text-slate-500 font-bold">{t('NONE (Отсутствует)', 'NONE (Absent)')}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed bg-white/5 p-2 rounded">
              {t('Классический DLS сглаживает всплески за счет ', 'Classical DLS smooths velocity spikes via ')}<Latex math="\lambda" />{t(', но продолжает передавать компоненты скорости в запрещенные направления ', ', but continues transmitting velocity components into forbidden directions ')}<Latex math="u_{\text{lost}}" />{t(', что ведет к неконтролируемым силовым нагрузкам на сервоприводы.', ', leading to uncontrolled force loads on actuators.')}
            </p>
          </div>

          {/* RICIS-Informed Box */}
          <div className="bg-[#09090B] border border-cyan-500/30 rounded-lg p-4 space-y-3 bg-cyan-950/10">
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
              <span className="font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                RICIS-Informed Controller
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {t('Активный Контроль', 'Active Control')}
              </span>
            </div>

            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{t('Скорость q̇₁_ricis:', 'Velocity q̇₁_ricis:')}</span>
                <strong className="text-emerald-400">{ricisJointVel1.toFixed(3)} {t('рад/с', 'rad/s')}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('Скорость q̇₂_ricis:', 'Velocity q̇₂_ricis:')}</span>
                <strong className="text-emerald-400">{ricisJointVel2.toFixed(3)} {t('рад/с', 'rad/s')}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-cyan-500/20 text-[10px]">
                <span>constraint_ricis:</span>
                <span className="text-amber-300 font-bold">P_range Proj + NullSpace Escape</span>
              </div>
            </div>

            <p className="text-[10px] text-cyan-200/80 leading-relaxed bg-cyan-950/30 border border-cyan-500/20 p-2 rounded">
              {Math.abs(ricisJointVel1 - classicalJointVel1) < 0.001 && Math.abs(ricisJointVel2 - classicalJointVel2) < 0.001 ? (
                <span><strong>{t('Честное совпадение:', 'Exact match:')}</strong> {t('При отсутствии движений в ', 'With no motion along ')}<Latex math="u_{\text{lost}}" /> {t('и нулевом выходе из ядра ', 'and zero departure from null space ')}<Latex math="q_c" />, <Latex math="\dot{q}_{\text{classical}} = \dot{q}_{\text{ricis}}" />. {t('Однако сигнатура RICIS готова применить ', 'However, the RICIS signature stands ready to enforce ')}<Latex math="P_{\text{range}}" /> {t('при перпендикулярном сдвиге!', 'upon perpendicular command shift!')}</span>
              ) : (
                <span><strong>{t('RICIS Управление активно:', 'RICIS Control Active:')}</strong> {t('Запрещенные скорости спроецированы в ', 'Forbidden velocities projected into ')}<Latex math="u_{\text{preserved}}" />, {t('а вектор в ядре ', 'and the kernel vector ')}<Latex math="(I - J^\dagger J)" /> {t('автономно уводит локоть к безопасной ', 'autonomously guides the elbow toward safe ')}<Latex math="q_c" />.</span>
              )}
            </p>
          </div>

        </div>
      </div>

      {/* 8. Historian Log Feed (История Не Стирается) */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">
              8. Historian Singularity Audit Feed ({t('История не стирается', 'History Preserved')})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {t('Всего записей:', 'Total entries:')} {historianLogs.length}
          </span>
        </div>

        {historianLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono bg-[#09090B] rounded-lg border border-white/5">
            {t('Сингулярных событий еще не зафиксировано. Измените угол θ₂ близким к 0° (напр. 2°), чтобы добавить событие в Historian.', 'No singular events logged yet. Adjust angle θ₂ near 0° (e.g. 2°) to add an event to Historian.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                  <th className="p-2">{t('Время / ID', 'Time / ID')}</th>
                  <th className="p-2">{t('Конфигурация q_s', 'Configuration q_s')}</th>
                  <th className="p-2">{t('Сигнатура 0_{det J}', 'Signature 0_{det J}')}</th>
                  <th className="p-2">κ(J) / σ_min</th>
                  <th className="p-2">Recovery Constraint</th>
                  <th className="p-2">Checkpoint q_c</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historianLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition text-[11px]">
                    <td className="p-2 text-slate-400 whitespace-nowrap">
                      <div>{log.timestamp}</div>
                      <div className="text-[9px] text-slate-600">{log.id}</div>
                    </td>
                    <td className="p-2 text-white font-bold whitespace-nowrap">
                      ({log.angle1}°, {log.angle2}°)
                    </td>
                    <td className="p-2 text-cyan-300 whitespace-nowrap">
                      <Latex math={`0_{(${log.detJ.toFixed(1)})}`} />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="text-amber-400 font-bold">κ={log.condNumber === Infinity ? '∞' : log.condNumber.toFixed(1)}</span>
                      <span className="text-[9px] text-slate-500 block">σ_min={log.sigmaMin.toFixed(2)}</span>
                    </td>
                    <td className="p-2 text-amber-300 text-[10px] max-w-[200px]">
                      {log.recoveryConstraint}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">({log.checkpoint.angle1}°, {log.checkpoint.angle2}°)</span>
                      <span className="text-[9px] text-slate-500 block">det J = {log.checkpoint.detJ.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
