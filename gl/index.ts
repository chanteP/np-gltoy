const DEFAULT_VERT = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  v_texCoord = (a_position + 1.0) * 0.5;
}
`;

const DEFAULT_FRAG = `
precision mediump float;

void main(){
    gl_FragColor=vec4(0.);
}

`;

const DEFAULT_RATIO = Math.min(window.devicePixelRatio ?? 1, 2);

export function ensureCanvas(canvas: HTMLCanvasElement, ratio = DEFAULT_RATIO) {
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
}

export function setBlend(gl: WebGLRenderingContext, blendMode: 'normal' | 'add' | 'multiply') {
    gl.enable(gl.BLEND);

    switch (blendMode) {
        case 'add':
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            break;
        case 'multiply':
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            break;
        case 'normal':
        default:
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            break;
    }
}
function injectVert(gl: WebGLRenderingContext, program: WebGLProgram) {
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

type InjectableMethod = keyof WebGLRenderingContext & `uniform${string}`;
type Tail<T extends any[]> = T extends [any, ...infer U] ? U : never;
function injectUniform<M extends InjectableMethod>(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    name: string,
    method: M,
    ...value: Tail<Parameters<WebGLRenderingContext[M]>>
) {
    const n = gl.getUniformLocation(program, name);
    // @ts-expect-error
    gl[method](n, ...value);
}

interface TextureOptions {
    flip?: false;
}

function injectTexture(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    name: string,
    index: number = 0,
    img: HTMLImageElement,
    options?: TextureOptions,
) {
    const texture = gl.createTexture();
    const sampler = gl.getUniformLocation(program, name);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options?.flip ?? 1 ? 1 : 0);
    gl.activeTexture(gl[`TEXTURE${index}`]);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(sampler, index);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
}

export function useInjectGlData(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement,
    options: {
        ratio: number;
    },
) {
    const lastMousePosition: [number, number] = [0, 0];
    const start = Date.now();

    function inject() {
        const now = new Date();
        // 为 u_time 提供值
        const uTimeLocation = gl.getUniformLocation(program, 'u_time');
        gl.uniform1f(uTimeLocation, (now.getTime() - start) / 1000);

        // 为 u_mouse 提供值
        const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');
        gl.uniform2f(uMouseLocation, ...lastMousePosition);

        const uResolution = gl.getUniformLocation(program, 'u_resolution');
        gl.uniform2f(uResolution, canvas.clientWidth * options.ratio, canvas.clientHeight * options.ratio);

        // 为 u_date 提供值
        const uDateLocation = gl.getUniformLocation(program, 'u_date');
        gl.uniform4f(
            uDateLocation,
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate(),
            now.getHours() + now.getMinutes() / 60,
        );

        // 为 u_camera 提供值
        // const uCameraLocation = gl.getUniformLocation(program, 'u_camera');
        // gl.uniform3f(uCameraLocation, 0.0, 0.0, -2.0);

        // 为 u_sampleRate 提供值
        // const uSampleRateLocation = gl.getUniformLocation(program, 'u_sampleRate');
        // gl.uniform1f(uSampleRateLocation, 44100.0);

        // 为 iResolution 提供值
        const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
        gl.uniform3f(iResolutionLocation, canvas.clientWidth, canvas.clientHeight, options.ratio);
    }

    function setMove(e: PointerEvent) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        lastMousePosition[0] = e.clientX / w;
        lastMousePosition[1] = e.clientY / h;
    }

    canvas.addEventListener('pointermove', setMove);

    return {
        inject,
        destroy: () => {
            canvas.removeEventListener('pointermove', setMove);
        },
    };
}

export function createGlContext(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
        alpha: true,
        depth: true,
        premultipliedAlpha: true,
    });
    if (!gl) {
        throw new Error(`webgl context create failed`);
    }
    setBlend(gl, 'normal');
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    return gl;
}

export function createProgram(gl: WebGLRenderingContext, shader?: { vert?: string; frag?: string }) {
    const program = gl.createProgram();
    // 创建顶点着色器
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    // 创建片元着色器
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!program) {
        throw new Error(`program create failed`);
    }
    if (!vShader || !fShader) {
        throw new Error(`shader create failed`);
    }
    // shader容器与着色器绑定
    gl.shaderSource(vShader, shader?.vert ?? DEFAULT_VERT);
    gl.shaderSource(fShader, shader?.frag ?? DEFAULT_FRAG);
    // 将GLSE语言编译成浏览器可用代码
    gl.compileShader(vShader);
    gl.compileShader(fShader);
    // 将着色器添加到程序上
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    // 链接程序，在链接操作执行以后，可以任意修改shader的源代码，
    // 对shader重新编译不会影响整个程序，除非重新链接程序
    gl.linkProgram(program);
    // 加载并使用链接好的程序
    gl.useProgram(program);

    const message = gl.getShaderInfoLog(fShader);
    if (message && message.length > 0) {
        /* message may be an error or a warning */
        throw message;
    }

    return program;
}

export function simpleInit(
    canvas: HTMLCanvasElement,
    options?: { fps?: number; vert?: string; frag?: string; ratio?: number; autoPlay?: boolean },
) {
    const ratio = options?.ratio ?? DEFAULT_RATIO;
    const fps = options?.fps ?? 40;

    ensureCanvas(canvas, ratio);
    const gl = createGlContext(canvas);

    const program = createProgram(gl, options);

    const { inject, destroy } = useInjectGlData(gl, program, canvas, { ratio });
    injectVert(gl, program);
    inject();

    let timer = 0;
    let lastRender = Date.now();
    const tickDuration = 1000 / fps;

    function renderTick() {
        const now = Date.now();
        if (now - lastRender >= tickDuration) {
            lastRender = now;

            gl.clearColor(0.0, 0.0, 0.0, 0.0); // 使用透明的黑色清除颜色
            gl.clear(gl.COLOR_BUFFER_BIT);

            inject();

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        timer = requestAnimationFrame(renderTick);
    }

    const api = {
        gl,
        inject: <M extends InjectableMethod>(
            name: string,
            method: M,
            ...value: Tail<Parameters<WebGLRenderingContext[M]>>
        ) => {
            injectUniform(gl, program, name, method, ...value);
        },
        injectTexture: (name: string, index: number, img: HTMLImageElement, options?: TextureOptions) => {
            injectTexture(gl, program, name, index, img, options);
        },
        play: () => {
            cancelAnimationFrame(timer);
            renderTick();
        },
        stop: () => {
            cancelAnimationFrame(timer);
        },
    };

    if (options?.autoPlay) {
        api.play();
    }
    return api;
}

export function renderFullScreenCanvas(options?: Parameters<typeof simpleInit>[1]) {
    const canvas = document.createElement('canvas');
    document.body.style.cssText += `margin:0;padding:0;`;
    canvas.style.cssText = `display:block;width:100vw;height:100vh;background:transparent;`;
    document.body.appendChild(canvas);
    ensureCanvas(canvas);

    return simpleInit(canvas, options);
}
