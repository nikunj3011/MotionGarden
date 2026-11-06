import {expect,it} from 'vitest';
import {newVariation} from '../../apps/web/src/variation';
import {manifestSchema} from '../artwork-contracts';
import json from '../../content/artworks/flow-field/v1/manifest.json';
it('randomizes every adjustable parameter within its range and step',()=>{
 const manifest=manifestSchema.parse(json);const current=Object.fromEntries(manifest.parameters.map(p=>[p.key,p.default]));
 for(const seed of [1,42,117,9999]){const variation=newVariation(manifest,current,seed,4,'dark');expect(variation.values.seed).toBe(seed);for(const p of manifest.parameters.filter(p=>p.key!=='seed')){const value=variation.values[p.key];expect(value).toBeGreaterThanOrEqual(p.min);expect(value).toBeLessThanOrEqual(p.max);expect(value).not.toBe(current[p.key]);expect((value-p.min)/p.step).toBeCloseTo(Math.round((value-p.min)/p.step))}expect(variation.colors).toHaveLength(4);for(const color of variation.colors)expect(color).toMatch(/^#[a-f0-9]{6}$/)}
});
it('repeats a variation for the same seed and keeps palettes appropriate to mode',()=>{const m=manifestSchema.parse(json);expect(newVariation(m,{},117,3,'white')).toEqual(newVariation(m,{},117,3,'white'));const dark=newVariation(m,{},117,3,'dark').colors,light=newVariation(m,{},117,3,'white').colors;for(let i=0;i<3;i++){const sum=(hex:string)=>[1,3,5].reduce((n,p)=>n+parseInt(hex.slice(p,p+2),16),0);expect(sum(dark[i])).toBeGreaterThan(sum(light[i]))}});
