import {expect,it} from 'vitest';
import {spectrumBands} from './audio';
import {commandSchema} from '../artwork-contracts';
it('separates real frequency bands, bounds energy and returns silence',()=>{expect(spectrumBands(new Uint8Array(128),48000,256)).toEqual({bass:0,mid:0,treble:0});const bins=new Uint8Array(128);bins[1]=255;const low=spectrumBands(bins,48000,256);expect(low.bass).toBeGreaterThan(0);expect(low.treble).toBe(0);bins.fill(255);expect(spectrumBands(bins,48000,256)).toEqual({bass:1,mid:1,treble:1})});
it('rejects nonfinite and out-of-range audio bridge inputs',()=>{for(const bass of [-1,2,NaN,Infinity])expect(commandSchema.safeParse({type:'SET_AUDIO',bands:{bass,mid:0,treble:0}}).success).toBe(false);expect(commandSchema.safeParse({type:'SET_AUDIO',bands:{bass:.5,mid:.2,treble:0}}).success).toBe(true)});
