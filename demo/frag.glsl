
// Author: @patriciogv
// Title: Simple Voronoi

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec2 random2(vec2 p){
    return fract(sin(vec2(dot(p,vec2(0.720,0.260)),dot(p,vec2(-0.610,0.840)) / 400.))*57.601);
}

float dist(vec2 st){
    float change_speed=u_time/1.8;
    
    // Tile the space
    vec2 i_st=floor(st);
    vec2 f_st=fract(st);
    
    float m_dist=10.;// minimum distance
    vec2 m_point;// minimum point
    
    for(int j=-1;j<=1;j++){
        for(int i=-1;i<=1;i++){
            vec2 neighbor=vec2(float(i),float(j));
            vec2 point=random2(i_st+neighbor);
            point=.5+.5*sin(change_speed+6.2831*point);
            vec2 diff=neighbor+point-f_st;
            float dist=length(diff);
            
            if(dist<m_dist){
                m_dist=dist;
                m_point=point;
            }
        }
    }
    return m_dist;
}

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution.xy;
    st.x*=u_resolution.x/u_resolution.y;
    vec4 color=vec4(.0);
    
    // Scale
    // st*=1.4;
    st*=3.;
    st.y= pow(st.y,1.2);

    vec2 bottom=st-vec2(12.2,7.5);

    st.y=st.y-sin(u_time / 1.3);
    bottom.y=bottom.y-sin(u_time/1.7);
    
    float m_dist=dist(st);
    float bottom_dist=dist(bottom);
    
    // Assign a color using the closest point position
    // color += dot(m_point,vec2(.5,.5));
    float alpha=m_dist*m_dist*m_dist+.7*bottom_dist*bottom_dist*bottom_dist;
    
    color=vec4(1.,1.,1.,alpha);
    
    // Add distance field to closest point center
    // color.g = m_dist;
    
    // Show isolines
    // color -= abs(sin(40.0*m_dist))*0.07;
    
    // Draw cell center
    // color += 1.-step(.05, m_dist);
    
    // Draw grid
    // color.r += step(.98, f_st.x) + step(.98, f_st.y);
    
    gl_FragColor=vec4(color);
}
