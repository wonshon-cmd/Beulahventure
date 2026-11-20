"""Original soundtrack for the Beulah reel, locked to the same beat grid as reel.html.
1 beat = 28 frames at 60 fps = 0.4667 s (128.6 BPM). Every sound starts exactly on a beat or an 8th/16th of a beat."""
import sys, wave
import numpy as np

SR = 48000
BEAT = 14 / 30
TOTAL_BEATS = 20
N = int(round(TOTAL_BEATS * BEAT * SR))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def t_(sec): return np.arange(int(SR * sec)) / SR
def at(b): return int(round(b * BEAT * SR))

def put(sig, b, gain=1.0, pan=0.0):
    i = at(b)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i+len(s)] += s * (1 - max(pan, 0))
    R[i:i+len(s)] += s * (1 + min(pan, 0))

def lp(x, cutoff):
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2*np.pi*c/SR); y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        z = (1-a[i])*x[i] + a[i]*z; y[i] = z
    return y
def hp(x, c): return x - lp(x, c)

def kick(dur=0.42):
    t = t_(dur); f = 42 + 110*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8)*np.minimum(t/0.001,1)

def boom(dur=1.0, f=45, decay=3.0):
    t = t_(dur); f_ = f + 80*np.exp(-t*22)
    s = np.tanh(2.0*np.sin(2*np.pi*np.cumsum(f_)/SR))*np.exp(-t*decay)
    crack = hp(rng.standard_normal(len(t)), 2000)*np.exp(-t*45)*0.8
    return (s + crack)*np.minimum(t/0.001,1)

def hat(dur=0.05):
    t = t_(dur); return hp(rng.standard_normal(len(t)), 7000)*np.exp(-t*90)

def clap():
    t = t_(0.22); n = hp(rng.standard_normal(len(t)), 1200)
    env = np.exp(-t*32) + 0.5*np.exp(-np.maximum(t-0.01,0)*60)*(t>0.01)
    return n*env*0.7

def riser(beats, f0=300, f1=8000):
    dur = beats*BEAT; t = t_(dur); n = rng.standard_normal(len(t))
    return lp(n, f0*(f1/f0)**(t/dur))*(t/dur)**2*1.5

def pluck(freq, dur=0.8):
    t = t_(dur)
    s = np.sin(2*np.pi*freq*t) + 0.35*np.sin(4*np.pi*freq*t) + 0.12*np.sin(6*np.pi*freq*t)
    return s*np.exp(-t*6)*np.minimum(t/0.003,1)

def pad(freqs, dur, attack, release):
    t = t_(dur); s = np.zeros(len(t))
    for f in freqs:
        for d in (-0.35, 0.0, 0.35):
            ph = f*(1+d/100)*t; s += 2*(ph-np.floor(ph+0.5))
    s = lp(s/(len(freqs)*3), 1500)
    return s*np.clip(np.minimum(t/attack,1)*np.minimum((dur-t)/release,1),0,1)

def whoosh(beats):
    dur = beats*BEAT; t = t_(dur); n = rng.standard_normal(len(t))
    return lp(n, 400+2800*np.sin(np.pi*t/dur))*np.sin(np.pi*t/dur)**2*0.8

# Piano version — same beat map as reel2.html
def piano(freq, dur=2.0, vel=1.0):
    t = t_(dur); s = np.zeros(len(t))
    for h, a in [(1,1.0),(2,0.45),(3,0.22),(4,0.12),(5,0.06)]:
        s += a*np.sin(2*np.pi*freq*h*t*(1+0.0004*h))*np.exp(-t*(1.6+h*0.9))
    return s*vel*np.minimum(t/0.004,1)*0.5
def chord(notes, b, vel=0.8, spread=0.0):
    for i, n in enumerate(notes):
        put(piano(n, 2.4, vel), b + i*spread, 0.6, pan=-0.25+0.5*i/max(len(notes)-1,1))
def softkick(): 
    t = t_(0.3); f = 50 + 60*np.exp(-t*35)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10)
def snap():
    t = t_(0.08); return hp(rng.standard_normal(len(t)), 2500)*np.exp(-t*70)*0.6

D3, E3, Fs3, G3, A3, B3 = 146.83, 164.81, 185.0, 196.0, 220.0, 246.94
D4, Fs4, A4, B4, D5, Fs5, A5, D6 = 293.66, 369.99, 440.0, 493.88, 587.33, 739.99, 880.0, 1174.66
A2, G2, B2 = 110.0, 98.0, 123.47
PROG = [[D3, Fs3, A3, D4], [A2, E3, A3, 277.18], [B2, Fs3, B3, D4], [G2, D3, G3, B3]]   # D  A  Bm  G

# Questions (0-2): single low notes, rising
for b, n in zip([0, 1, 2], [D3, E3, Fs3]):
    put(piano(n, 2.0, 1.0), b, 0.9); put(piano(n*2, 2.0, 0.5), b, 0.5)
# From beat 3: chord progression, one chord every 2 beats, soft kick + snap groove
for k, b in enumerate(range(3, 17, 2)):
    chord(PROG[k % 4], b, 0.75)
for b in range(3, 17):
    put(softkick(), b, 0.7)
    if b % 2 == 0: put(snap(), b, 0.5)
    put(hat(), b + 0.5, 0.10, pan=0.3)
# Accents on the bold lines (same beats as the slams)
for b, n in [(4, D5), (6, Fs5), (8, A5), (13, D5), (15, A5)]:
    put(piano(n, 1.6, 0.9), b, 0.55); put(softkick(), b, 0.5)
# Seed -> tree: rising notes
for b, n in zip([9.5, 10, 10.5, 11], [D5, Fs5, A5, D6]):
    put(piano(n, 1.8, 0.8), b, 0.5)
# Stay tuned (16): 16th-note repeated A, light riser
for k in range(4):
    put(piano(A4 if k < 3 else B4, 0.6, 0.7), 16 + k/4, 0.45)
put(riser(1, 400, 6000), 16, 0.35)
FINAL = 17
# Logo: wide D major chord, rolled, rings out
put(piano(D3/2, 4.0, 1.0), FINAL, 0.7)
chord([D3, A3, D4, Fs4, A4, D5], FINAL, 0.8, spread=0.06)

def room(x, secs=2.2, wet=0.18):
    ir_t = t_(secs); ir = lp(rng.standard_normal(len(ir_t))*np.exp(-ir_t*3.5), 5000)
    ir /= np.sqrt((ir**2).sum()); n = len(x)+len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n)*np.fft.rfft(ir, n), n)[:len(x)]
    return x*(1-wet) + y*wet*2
L = room(L); R = room(R)
mix = np.tanh(np.stack([L, R], 1)*0.9)
fl = int(1.2*SR); mix[-fl:] *= np.linspace(1, 0, fl)[:, None]**2   # slow fade over the logo
mix /= np.abs(mix).max()/0.75
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok seconds', N/SR)
