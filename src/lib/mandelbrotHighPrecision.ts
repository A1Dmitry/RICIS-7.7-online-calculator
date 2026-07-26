export class BigDouble {
    hi: number;
    lo: number;

    constructor(hi: number, lo: number = 0.0) {
        this.hi = hi;
        this.lo = lo;
    }

    toNumber(): number {
        return this.hi + this.lo;
    }
}

// TwoSum algorithm (Knuth)
function twoSum(a: number, b: number): [number, number] {
    const s = a + b;
    const aPrime = s - b;
    const bPrime = s - aPrime;
    const err = (a - aPrime) + (b - bPrime);
    return [s, err];
}

// QuickTwoSum (if |a| >= |b|)
function quickTwoSum(a: number, b: number): [number, number] {
    const s = a + b;
    const err = b - (s - a);
    return [s, err];
}

function twoProd(a: number, b: number): [number, number] {
    const p = a * b;
    // FMA is not available natively in JS without WASM, use splitting
    const SPLIT = 134217729.0; // 2^27 + 1
    
    const a1 = a * SPLIT;
    const a_hi = a1 - (a1 - a);
    const a_lo = a - a_hi;
    
    const b1 = b * SPLIT;
    const b_hi = b1 - (b1 - b);
    const b_lo = b - b_hi;
    
    const err = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
    return [p, err];
}

function addDD(a_hi: number, a_lo: number, b_hi: number, b_lo: number): [number, number] {
    const [s, e] = twoSum(a_hi, b_hi);
    const e2 = e + a_lo + b_lo;
    const [s2, e3] = quickTwoSum(s, e2);
    return [s2, e3];
}

function mulDD(a_hi: number, a_lo: number, b_hi: number, b_lo: number): [number, number] {
    const [p, e] = twoProd(a_hi, b_hi);
    const e2 = e + a_hi * b_lo + a_lo * b_hi;
    const [s, e3] = quickTwoSum(p, e2);
    return [s, e3];
}

export function renderMandelbrotFrame(
    width: number, 
    height: number, 
    maxIterations: number, 
    cx: BigDouble, 
    cy: BigDouble, 
    tileWidth: number,
    smooth: boolean
): Float64Array {
    const buffer = new Float64Array(width * height);
    
    // We will use standard perturbation theory for deep zooms.
    // C_ref is the center of the tile.
    const C_ref_re_hi = cx.hi;
    const C_ref_re_lo = cx.lo;
    const C_ref_im_hi = cy.hi;
    const C_ref_im_lo = cy.lo;
    
    // Precompute reference orbit
    // Z_{n+1} = Z_n^2 + C_ref
    // We only need standard float64 for the reference orbit if we are applying it in standard float64 perturbation!
    // Wait, the reference orbit MUST be stored.
    const refOrbitRe = new Float64Array(maxIterations);
    const refOrbitIm = new Float64Array(maxIterations);
    
    let z_re_hi = 0.0, z_re_lo = 0.0;
    let z_im_hi = 0.0, z_im_lo = 0.0;
    
    let refIter = 0;
    while (refIter < maxIterations) {
        // Z^2 = (z_re + i z_im)^2 = (z_re^2 - z_im^2) + i (2 * z_re * z_im)
        const [z_re2_hi, z_re2_lo] = mulDD(z_re_hi, z_re_lo, z_re_hi, z_re_lo);
        const [z_im2_hi, z_im2_lo] = mulDD(z_im_hi, z_im_lo, z_im_hi, z_im_lo);
        
        const [sub_hi, sub_lo] = addDD(z_re2_hi, z_re2_lo, -z_im2_hi, -z_im2_lo);
        const [next_re_hi, next_re_lo] = addDD(sub_hi, sub_lo, C_ref_re_hi, C_ref_re_lo);
        
        const [z_re_im_hi, z_re_im_lo] = mulDD(z_re_hi, z_re_lo, z_im_hi, z_im_lo);
        const [z_im_re_hi, z_im_re_lo] = addDD(z_re_im_hi, z_re_im_lo, z_re_im_hi, z_re_im_lo); // 2 * z_re * z_im
        const [next_im_hi, next_im_lo] = addDD(z_im_re_hi, z_im_re_lo, C_ref_im_hi, C_ref_im_lo);
        
        z_re_hi = next_re_hi;
        z_re_lo = next_re_lo;
        z_im_hi = next_im_hi;
        z_im_lo = next_im_lo;
        
        refOrbitRe[refIter] = z_re_hi;
        refOrbitIm[refIter] = z_im_hi;
        
        if (z_re_hi * z_re_hi + z_im_hi * z_im_hi > 16.0) {
            break;
        }
        refIter++;
    }
    
    let index = 0;
    for (let py = 0; py < height; py++) {
        const stY = (py + 0.5) / height;
        const delta_c_im = ((1.0 - stY) - 0.5) * tileWidth;
        
        for (let px = 0; px < width; px++) {
            const stX = (px + 0.5) / width;
            const delta_c_re = (stX - 0.5) * tileWidth;
            
            let dZ_re = 0.0;
            let dZ_im = 0.0;
            let iteration = 0;
            
            while (iteration < refIter) {
                // Z_n is the reference orbit at step n.
                // For iteration = 0, Z_0 = 0.
                const Z_re = iteration === 0 ? 0.0 : refOrbitRe[iteration - 1];
                const Z_im = iteration === 0 ? 0.0 : refOrbitIm[iteration - 1];
                
                // dZ_{n+1} = 2 * Z_n * dZ_n + dZ_n^2 + delta_c
                const dZ_re2 = dZ_re * dZ_re - dZ_im * dZ_im;
                const dZ_im2 = 2.0 * dZ_re * dZ_im;
                
                const term_re = 2.0 * (Z_re * dZ_re - Z_im * dZ_im);
                const term_im = 2.0 * (Z_re * dZ_im + Z_im * dZ_re);
                
                const next_dZ_re = term_re + dZ_re2 + delta_c_re;
                const next_dZ_im = term_im + dZ_im2 + delta_c_im;
                
                dZ_re = next_dZ_re;
                dZ_im = next_dZ_im;
                
                // z_{n+1} = Z_{n+1} + dZ_{n+1}
                const z_re = refOrbitRe[iteration] + dZ_re;
                const z_im = refOrbitIm[iteration] + dZ_im;
                
                if (z_re * z_re + z_im * z_im > 4.0) {
                    break;
                }
                
                iteration++;
            }
            
            // If we escaped before the reference orbit ended, or if we reached the end of the reference orbit and it escaped
            // Actually, if we reach refIter, maybe the reference orbit escaped, but this pixel didn't?
            // Standard perturbation theory says if we reach refIter, we either escaped or we should continue with standard float64.
            if (iteration === refIter) {
                // If the reference orbit didn't escape but we reached maxIterations, it's inside.
                if (refIter === maxIterations) {
                    buffer[index++] = maxIterations;
                    continue;
                }
                // If reference orbit escaped at refIter, we should continue iterating this pixel normally using standard float64!
                // Because standard float64 has enough precision now since |Z| is large!
                let Z_re = refOrbitRe[refIter - 1] + dZ_re;
                let Z_im = refOrbitIm[refIter - 1] + dZ_im;
                
                while (iteration < maxIterations) {
                    const z_re2 = Z_re * Z_re - Z_im * Z_im + (cx.hi + delta_c_re);
                    const z_im2 = 2.0 * Z_re * Z_im + (cy.hi + delta_c_im);
                    Z_re = z_re2;
                    Z_im = z_im2;
                    
                    if (Z_re * Z_re + Z_im * Z_im > 4.0) {
                        break;
                    }
                    iteration++;
                }
                
                if (iteration === maxIterations) {
                    buffer[index++] = maxIterations;
                    continue;
                }
                
                if (smooth) {
                    const log_zn = Math.log(Z_re * Z_re + Z_im * Z_im) / 2;
                    const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
                    buffer[index++] = iteration + 1 - nu;
                } else {
                    buffer[index++] = iteration;
                }
                continue;
            }
            
            if (smooth) {
                const z_re = refOrbitRe[iteration] + dZ_re;
                const z_im = refOrbitIm[iteration] + dZ_im;
                const log_zn = Math.log(z_re * z_re + z_im * z_im) / 2;
                const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
                buffer[index++] = iteration + 1 - nu;
            } else {
                buffer[index++] = iteration;
            }
        }
    }
    return buffer;
}
