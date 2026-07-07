/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SingularityMode {
  GRAVITATIONAL = 'GRAVITATIONAL',
  COMPLEX_ANALYSIS = 'COMPLEX_ANALYSIS',
  KINEMATIC = 'KINEMATIC',
  NAVIER_STOKES = 'NAVIER_STOKES',
  RIEMANN = 'RIEMANN',
  YANG_MILLS = 'YANG_MILLS',
  P_VS_NP = 'P_VS_NP',
  HODGE = 'HODGE',
  BSD = 'BSD',
  POINCARE = 'POINCARE',
  THEORY = 'THEORY',
  CASES_AND_SOLUTIONS = 'CASES_AND_SOLUTIONS',
  RICIS_AGENT = 'RICIS_AGENT'
}

export interface GravitationalState {
  mass: number;        // in Solar Masses (M_sun)
  spin: number;        // angular momentum parameter a (0 to 1, where 1 is extremal)
  charge: number;      // electric charge Q (0 to 1, where 1 is extremal)
  radius: number;      // distance from center r (in terms of R_s)
  regularization: number; // RICIS III parameter theta (0 to 2)
}

export interface ComplexState {
  funcType: 'pole_1' | 'pole_2' | 'essential' | 'branch';
  singularityX: number; // real part of z_0
  singularityY: number; // imaginary part of z_0
  zoom: number;
  blowUp: number;       // RICIS III regularization parameter epsilon (0 to 1)
  cursorX: number;     // real part of evaluated z
  cursorY: number;     // imaginary part of evaluated z
}

export interface KinematicState {
  angle1: number;      // theta_1 in degrees
  angle2: number;      // theta_2 in degrees
  length1: number;     // link length L_1
  length2: number;     // link length L_2
  targetVx: number;    // desired end-effector velocity v_x
  targetVy: number;    // desired end-effector velocity v_y
  damping: number;     // RICIS III damping factor lambda (0 to 0.5)
}

export interface NavierStokesState {
  reynolds: number;         // Reynolds number / vortex strength
  radialVelocity: number;   // radial contraction/divergence speed
  observerRadius: number;   // distance from core center r
  regularization: number;   // RICIS III parameter theta (0 to 1.5)
  viscosity: number;        // fluid kinematic viscosity nu
}

export interface RiemannState {
  sigma: number;            // Real part of s (0 to 2)
  t: number;                // Imaginary part of s (-10 to 40)
  regularization: number;   // RICIS III parameter theta (0 to 1)
  zoom: number;             // visual zoom (1 to 10)
}

export interface YangMillsState {
  coupling: number;         // gauge coupling constant g (0.1 to 3)
  distance: number;         // distance r from color charge (0 to 2)
  regularization: number;   // RICIS III parameter theta (0 to 1)
  energyScale: number;      // energy scale Q (0.1 to 5)
}

export interface PVsNPState {
  dimension: number;        // complexity size N (10 to 100)
  ruggedness: number;       // ruggedness of the NP landscape (0 to 1)
  regularization: number;   // RICIS theta parameter (0 to 1)
  algorithmSpeed: number;   // speed factor
}

export interface HodgeState {
  genus: number;            // genus (1 to 5)
  cycleDimension: number;   // algebraic cycle dimension (1 to 3)
  regularization: number;   // RICIS theta parameter (0 to 1)
  noiseLevel: number;       // noise level
}

export interface BSDState {
  coefA: number;            // y^2 = x^3 + Ax + B
  coefB: number;            // y^2 = x^3 + Ax + B
  regularization: number;   // RICIS theta parameter (0 to 1)
  centralPointS: number;    // central evaluation point s (usually 1)
}

export interface PoincareState {
  neckRadius: number;       // size of the bottleneck
  flowTime: number;         // time t of the Ricci flow
  regularization: number;   // RICIS theta parameter (0 to 1)
  mode: 'neckpinch' | 'sphere';
}

