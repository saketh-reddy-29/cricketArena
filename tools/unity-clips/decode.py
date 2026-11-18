"""Decode Unity Humanoid (muscle) AnimationClip JSON exports into per-frame muscle values.
Streamed clip layout (Unity): repeated frames of  [time:f32][nKeys:u32] then nKeys x [curve:u32][x,y,z,w:f32]
A key defines the cubic  v(dt) = ((x*dt + y)*dt + z)*dt + w  that holds until that curve's next key.
Curve index space: [0..streamed) streamed, then dense curves, then constant curves.
m_IndexArray maps humanoid value slots (7.. = muscles) to curve indices (-1 = not animated)."""
import json, struct, numpy as np

def f32(u): return struct.unpack('<f', struct.pack('<I', u & 0xFFFFFFFF))[0]

def decode_streamed(data):
    i, frames = 0, []
    while i + 1 < len(data):
        t = f32(data[i]); n = data[i + 1]; i += 2
        keys = []
        for _ in range(n):
            keys.append((data[i], [f32(data[i + 1 + j]) for j in range(4)])); i += 5
        frames.append((t, keys))
    return frames

def load_clip(path):
    d = json.load(open(path))
    mc = d['m_MuscleClip']; cd = mc['m_Clip']['data']
    sc = cd['m_StreamedClip']; n_stream = sc['curveCount']
    dense = cd['m_DenseClip']; const = cd['m_ConstantClip']['data']
    frames = decode_streamed(sc['data'])
    curves = [[] for _ in range(n_stream)]
    for t, keys in frames:
        for idx, c in keys:
            if idx < n_stream: curves[idx].append((t, c))
    return dict(name=d['m_Name'], stop=mc['m_StopTime'], rate=d['m_SampleRate'], curves=curves, n_stream=n_stream,
                dense=dense, const=const, index=mc['m_IndexArray'], loop=mc['m_LoopTime'])

def eval_curves(clip, T):
    """value of every curve at time T"""
    n_s = clip['n_stream']; dn = clip['dense']['m_CurveCount']; const = clip['const']
    out = np.zeros(n_s + dn + len(const), dtype=np.float64)
    for ci, keys in enumerate(clip['curves']):
        v = 0.0
        for t, c in keys:
            if t <= T: kt, kc = t, c
            else: break
        else:
            pass
        # last key with time <= T
        sel = None
        for t, c in keys:
            if t <= T: sel = (t, c)
            else: break
        if sel:
            dt = T - sel[0]; x, y, z, w = sel[1]
            v = ((x * dt + y) * dt + z) * dt + w
        out[ci] = v
    if dn:
        sa = clip['dense']['m_SampleArray']; fc = clip['dense']['m_FrameCount']; sr = clip['dense']['m_SampleRate']
        f = min(int(round(T * sr)), fc - 1)
        for k in range(dn): out[n_s + k] = sa[f * dn + k]
    out[n_s + dn:] = const
    return out

def muscles_at(clip, T):
    """55 body DoF + 40 finger muscles (value slots 7..101 via IndexArray); missing -> 0"""
    cv = eval_curves(clip, T); ia = clip['index']
    m = np.zeros(95)
    for k in range(95):
        s = 7 + k
        if s < len(ia) and ia[s] >= 0: m[k] = cv[ia[s]]
    return m
