import frag from './frag.glsl';
import { simpleInit, renderFullScreenCanvas } from '../gl';

document.body.style.background = `linear-gradient(180deg, rgb(255 244 208), rgb(84 203 177))`;
renderFullScreenCanvas({
    frag,
    autoPlay: true,
});
