import {cp,mkdir} from 'node:fs/promises';
import {validate} from './validate.mjs';
await validate();
for(const target of ['apps/android/app/src/main/assets/bundle','apps/ios/MotionGarden/bundle']){await mkdir(target,{recursive:true});for(const directory of ['assets','artworks','catalog','renderer'])await cp(`dist/${directory}`,`${target}/${directory}`,{recursive:true});}
console.log('Packaged identical renderer and content for Android and iOS.');
