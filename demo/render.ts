import frag from './texture.glsl';
import { simpleInit, renderFullScreenCanvas, loadImage } from '../gl';

async function main() {
    // document.body.style.background = `linear-gradient(180deg, rgb(255 244 208), rgb(84 203 177))`;

    const img = await loadImage('https://ms.bdstatic.com/se/static/indexatom/personalcenter/assets/img/default_icon_02f13d8.png');

    const { injectTexture, gl } = renderFullScreenCanvas({
        frag,
        autoPlay: true,
    });

    injectTexture('img', 0, img, { mipmap: true });
}

main();
