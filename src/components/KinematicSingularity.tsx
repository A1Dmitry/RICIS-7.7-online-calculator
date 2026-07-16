/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { KinematicState } from '../types';
import { Cpu, Shield, Zap, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface KinematicSingularityProps {
  preset?: KinematicState;
  onChangeState?: (state: KinematicState) => void;
}

export default function KinematicSingularity({ preset, onChangeState }: KinematicSingularityProps = {}) {
  const [state, setState] = useState<KinematicState>({
    angle1: 45,        // theta_1 degrees
    angle2: 10,        // theta_2 degrees (very close to 0 -> singularity)
    length1: 100,      // link 1 length px
    length2: 80,       // link 2 length px
    targetVx: 20,      // desired end-effector velocity x
    targetVy: -10,     // desired end-effector velocity y
    damping: 0.15      // RICIS lambda parameter
  });

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

  // Degrees to radians helper
  const rad = (deg: number) => (deg * Math.PI) / 180;

  const th1 = rad(state.angle1);
  const th2 = rad(state.angle2);
  const L1 = state.length1;
  const L2 = state.length2;
  const vx = state.targetVx;
  const vy = state.targetVy;
  const lambda = state.damping;

  // 1. Forward Kinematics
  // Base at (centerX, centerY)
  // Elbow position:
  const elbx = L1 * Math.cos(th1);
  const elby = L1 * Math.sin(th1);
  // End Effector position:
  const eex = elbx + L2 * Math.cos(th1 + th2);
  const eey = elby + L2 * Math.sin(th1 + th2);

  // 2. Jacobian Matrix
  // J = [ J11 J12 ]
  //     [ J21 J22 ]
  const J11 = -L1 * Math.sin(th1) - L2 * Math.sin(th1 + th2);
  const J12 = -L2 * Math.sin(th1 + th2);
  const J21 = L1 * Math.cos(th1) + L2 * Math.cos(th1 + th2);
  const J22 = L2 * Math.cos(th1 + th2);

  // Determinant: det(J) = L1 * L2 * sin(theta_2)
  const detJ = L1 * L2 * Math.sin(th2);
  const manipulability = Math.abs(detJ);

  // SVD/Ellipsoid Calculation (Eigenvalues of J J^T)
  // JJ^T = [ E  F ]
  //        [ F  G ]
  const E = J11 * J11 + J12 * J12;
  const F = J11 * J21 + J12 * J22;
  const G = J21 * J21 + J22 * J22;

  // Eigenvalues of symmetric 2x2 matrix
  const trace = E + G;
  const det_JJT = E * G - F * F;
  const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * det_JJT));
  const eig1 = (trace + discriminant) / 2;
  const eig2 = (trace - discriminant) / 2;

  const sigma1 = Math.sqrt(Math.max(0, eig1)); // Semi-major axis
  const sigma2 = Math.sqrt(Math.max(0, eig2)); // Semi-minor axis

  // Ellipse orientation angle
  const ellipseAngle = 0.5 * Math.atan2(2 * F, E - G);

  // 3. Inverse Kinematics / Singularity Resolution
  let jointVel1 = 0;
  let jointVel2 = 0;
  let trackingError = 0;
  let errorX = 0;
  let errorY = 0;

  // Damped Least Squares (DLS) Inverse:
  // J* = J^T * (J * J^T + lambda^2 * I)^(-1)
  const lam2 = lambda * lambda;
  const A11 = E + lam2;
  const A12 = F;
  const A21 = F;
  const A22 = G + lam2;

  const detA = A11 * A22 - A12 * A21;
  
  if (Math.abs(detA) > 1e-9) {
    // Inverse of A = J J^T + lambda^2 I
    const A_inv11 = A22 / detA;
    const A_inv12 = -A12 / detA;
    const A_inv21 = -A21 / detA;
    const A_inv22 = A11 / detA;

    // J* = J^T * A_inv
    const J_star11 = J11 * A_inv11 + J21 * A_inv21;
    const J_star12 = J11 * A_inv12 + J21 * A_inv22;
    const J_star21 = J12 * A_inv11 + J22 * A_inv21;
    const J_star22 = J12 * A_inv12 + J22 * A_inv22;

    // Joint Velocities: q_dot = J* * v
    jointVel1 = J_star11 * vx + J_star12 * vy;
    jointVel2 = J_star21 * vx + J_star22 * vy;

    // Achieved velocity: v_achieved = J * q_dot
    const vx_achieved = J11 * jointVel1 + J12 * jointVel2;
    const vy_achieved = J21 * jointVel1 + J22 * jointVel2;

    errorX = vx - vx_achieved;
    errorY = vy - vy_achieved;
    trackingError = Math.sqrt(errorX * errorX + errorY * errorY);
  }

  // Classical velocities (for comparison/warnings)
  let classJointVel1 = 0;
  let classJointVel2 = 0;
  if (Math.abs(detJ) > 1e-4) {
    classJointVel1 = (J22 * vx - J12 * vy) / detJ;
    classJointVel2 = (-J21 * vx + J11 * vy) / detJ;
  } else {
    classJointVel1 = Infinity;
    classJointVel2 = Infinity;
  }

  // Limit indicators
  const isCloseToSingularity = manipulability < 1500;
  const velocitiesBlowUp = (Math.abs(classJointVel1) > 1.5 || Math.abs(classJointVel2) > 1.5) && lambda === 0;

  // Redraw Robotic Arm
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const base_X = width / 2;
    const base_Y = height / 2 + 30;

    // Draw coordinate grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base_Y);
    ctx.lineTo(width, base_Y);
    ctx.moveTo(base_X, 0);
    ctx.lineTo(base_X, height);
    ctx.stroke();

    // Robot link positions in pixel space
    const elb_pixel_X = base_X + elbx;
    const elb_pixel_Y = base_Y - elby; // invert Y for standard math screen coordinates
    const ee_pixel_X = base_X + eex;
    const ee_pixel_Y = base_Y - eey;

    // 1. Draw Manipulability Ellipse at End-Effector
    if (sigma1 > 0.1) {
      ctx.save();
      ctx.translate(ee_pixel_X, ee_pixel_Y);
      ctx.rotate(-ellipseAngle); // Negative because of flipped screen Y coordinate
      
      // Draw filled ellipse
      ctx.beginPath();
      // Scale down the ellipse axes for better visibility
      const scaleEllipse = 0.15; 
      ctx.ellipse(0, 0, sigma1 * scaleEllipse, sigma2 * scaleEllipse, 0, 0, 2 * Math.PI);
      ctx.fillStyle = isCloseToSingularity ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 211, 238, 0.05)';
      ctx.fill();

      // Ellipse border
      ctx.strokeStyle = isCloseToSingularity ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Target Velocity Vector at End-Effector
    ctx.beginPath();
    ctx.moveTo(ee_pixel_X, ee_pixel_Y);
    // Draw scaled vector
    const scaleVector = 1.5;
    const endVectorX = ee_pixel_X + vx * scaleVector;
    const endVectorY = ee_pixel_Y - vy * scaleVector; // invert Y
    ctx.lineTo(endVectorX, endVectorY);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw arrow tip for vector
    const angleVec = Math.atan2(endVectorY - ee_pixel_Y, endVectorX - ee_pixel_X);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(endVectorX, endVectorY);
    ctx.lineTo(endVectorX - 7 * Math.cos(angleVec - Math.PI/6), endVectorY - 7 * Math.sin(angleVec - Math.PI/6));
    ctx.lineTo(endVectorX - 7 * Math.cos(angleVec + Math.PI/6), endVectorY - 7 * Math.sin(angleVec + Math.PI/6));
    ctx.fill();

    // Label vector
    ctx.fillStyle = '#22d3ee';
    ctx.font = '10px monospace';
    ctx.fillText('v_target', endVectorX + 5, endVectorY - 5);

    // 3. Draw Robot arm structure
    // Link 1 (Base to Elbow)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(base_X, base_Y);
    ctx.lineTo(elb_pixel_X, elb_pixel_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(base_X, base_Y);
    ctx.lineTo(elb_pixel_X, elb_pixel_Y);
    ctx.stroke();

    // Link 2 (Elbow to End Effector)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(elb_pixel_X, elb_pixel_Y);
    ctx.lineTo(ee_pixel_X, ee_pixel_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(elb_pixel_X, elb_pixel_Y);
    ctx.lineTo(ee_pixel_X, ee_pixel_Y);
    ctx.stroke();

    // Joints representation
    // Base Joint
    ctx.beginPath();
    ctx.arc(base_X, base_Y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Elbow Joint
    ctx.beginPath();
    ctx.arc(elb_pixel_X, elb_pixel_Y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // End-Effector Point
    ctx.beginPath();
    ctx.arc(ee_pixel_X, ee_pixel_Y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

  }, [state, elbx, elby, eex, eey, vx, vy, sigma1, sigma2, ellipseAngle, isCloseToSingularity]);

  // Compute tracking quality metrics
  const targetMag = Math.sqrt(vx * vx + vy * vy);
  const accuracyPercent = targetMag > 0.01 
    ? Math.max(0, Math.min(100, (1 - trackingError / targetMag) * 100))
    : 100;

  return (
    <div id="kinematic-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-300">
      {/* Simulation Screen */}
      <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Двухзвенный робот-манипулятор</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-cyan-400" />
              Демпфирование DLS
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Зеленый эллипс показывает способность манипулятора ускоряться в различных направлениях. Когда звено полностью вытянуто, эллипс схлопывается в отрезок (сингулярность Якобиана).
          </p>
        </div>

        <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#09090B] flex items-center justify-center p-2">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={280} 
            className="w-full h-auto max-h-[280px] rounded block"
          />

          {/* Alert messages */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
            {isCloseToSingularity && (
              <div className="bg-red-950/80 border border-red-500/30 text-red-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Определитель Якобиана стремится к нулю!</span>
              </div>
            )}
            {velocitiesBlowUp && (
              <div className="bg-rose-950/80 border border-rose-500/30 text-rose-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Бесконечные скорости (Velocities Blow-up)!</span>
              </div>
            )}
            {lambda > 0.01 && (
              <div className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Затухание RICIS III (DLS) Активно</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Telemetry Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Якобиан det(J)</span>
            <span className={`text-sm font-semibold font-mono block mt-1 ${isCloseToSingularity ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {detJ.toFixed(1)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">L₁L₂sin(θ₂)</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Скорость q̇₁</span>
            <span className="text-sm font-semibold text-amber-400 font-mono block mt-1">
              {jointVel1 === Infinity ? '∞' : `${(jointVel1 * 10).toFixed(2)} рад/с`}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              Кл: {classJointVel1 === Infinity ? '∞' : `${(classJointVel1 * 10).toFixed(1)}`}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Скорость q̇₂</span>
            <span className="text-sm font-semibold text-amber-400 font-mono block mt-1">
              {jointVel2 === Infinity ? '∞' : `${(jointVel2 * 10).toFixed(2)} рад/с`}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              Кл: {classJointVel2 === Infinity ? '∞' : `${(classJointVel2 * 10).toFixed(1)}`}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Точность следования</span>
            <span className={`text-sm font-semibold font-mono block mt-1 ${accuracyPercent > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {accuracyPercent.toFixed(1)}%
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Ошибка: {trackingError.toFixed(2)} м/с</span>
          </div>
        </div>
      </div>

      {/* Control sliders */}
      <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">Характеристики манипулятора</h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Геометрия звеньев и векторы движения</p>
          </div>

          {/* Preset Selector */}
          <div className="bg-[#09090B] border border-white/5 p-3 rounded-lg space-y-2">
            <label className="text-slate-500 font-mono uppercase text-[9px] block tracking-wider">Типовой сценарий</label>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setState({ angle1: 0, angle2: 180, length1: 100, length2: 80, targetVx: 30, targetVy: 20, damping: 0 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Выпрямленный сустав (Без λ)
              </button>
              <button 
                type="button"
                onClick={() => setState({ angle1: 45, angle2: 2, length1: 100, length2: 80, targetVx: 20, targetVy: -10, damping: 0.05 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Схлопывание с микро-λ
              </button>
              <button 
                type="button"
                onClick={() => setState({ angle1: 0, angle2: 180, length1: 100, length2: 80, targetVx: 30, targetVy: 20, damping: 0.2 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Демпфирование RICIS III
              </button>
            </div>
          </div>

          {/* Angle 1 slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Угол плечевого сустава (θ₁)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.angle1}°</span>
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
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Угол локтевого сустава (θ₂)</label>
              <span className={`font-mono px-2.5 py-1 text-xs rounded border ${
                Math.abs(state.angle2) < 8 
                  ? 'text-red-400 bg-red-950/20 border-red-500/30 animate-pulse font-bold' 
                  : 'text-white bg-white/5 border border-white/10'
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

          {/* Velocity Target vector x */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Скорость эффектора V_x</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.targetVx} м/с</span>
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
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Скорость эффектора V_y</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.targetVy} м/с</span>
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

          {/* DLS Damping lambda */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-cyan-400 font-mono uppercase font-semibold text-[10px]">Демпфер затухания (λ)</label>
              <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 text-xs rounded">{state.damping.toFixed(2)}</span>
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
        </div>

        {/* Google Sheets Export */}
        <div className="mt-4">
          <ExportToSheetsButton 
            mode="KINEMATIC" 
            params={state} 
            defaultDescription={`Кинематика робота: углы=(${state.angle1}, ${state.angle2}), демпфер λ=${state.damping}`} 
          />
        </div>

        {/* Dynamic warning or info text */}
        {state.damping === 0 && Math.abs(state.angle2) < 15 ? (
          <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-lg text-xs text-red-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Взрыв скоростей!</span>
            </div>
            <p className="leading-relaxed">
              При λ = 0 расчетная скорость шарниров стремится к бесконечности. Это вызывает отказ сервоприводов. Увеличьте λ для включения DLS.
            </p>
          </div>
        ) : state.damping > 0.05 && Math.abs(state.angle2) < 15 ? (
          <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Проход сингулярности</span>
            </div>
            <p className="leading-relaxed">
              Демпфирование RICIS III λ = {state.damping.toFixed(2)} ограничило скорости суставов до безопасных значений. Манипулятор прошел мертвую точку стабильно.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg text-xs text-slate-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-200/80 font-mono">Вектор скоростей</span>
            </div>
            <p className="leading-relaxed">
              Изменяйте углы плеча и локтя. Голубая стрелка показывает вектор движения эффектора. Эллипс иллюстрирует запас маневренности эффектора.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
