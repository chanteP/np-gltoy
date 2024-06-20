#version 300 es

// 指定默认精度为 highp
precision highp float;
precision highp sampler2D; // 指定精度和 sampler2D 类型

in vec2 v_texCoord; // 从顶点着色器传入的纹理坐标
out vec4 fragColor; // 片段颜色输出

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D img;

void main(){
    vec2 st=v_texCoord.xy;
    // st.x*=u_resolution.x/u_resolution.y;
    st.y*=u_resolution.y/u_resolution.x;

    // vec4 color = texture(img, st);
    vec4 color = textureLod(img, st, 1.);

    fragColor=vec4(color);
}
