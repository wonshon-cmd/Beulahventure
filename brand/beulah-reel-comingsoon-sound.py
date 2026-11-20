"""Original soundtrack for the Beulah reel, locked to the same beat grid as reel.html.
1 beat = 28 frames at 60 fps = 0.4667 s (128.6 BPM). Every sound starts exactly on a beat or an 8th/16th of a beat."""
import sys, wave
import numpy as np

SR = 48000
BEAT = 14 / 30
TOTAL_BEATS = 19
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

# Beat map (same as reel3.html) — coming-soon teaser
D = 293.66
def fall(beats, f0=420, f1=50):
    dur = beats*BEAT; t = t_(dur)
    f = f0*(f1/f0)**(t/dur)
    tone = np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.2)
    n = lp(rng.standard_normal(len(t)), 4000*(1-t/dur)+200)*np.exp(-t*2)
    return (tone*0.7 + n*0.8)*np.minimum(t/0.003,1)

# Dark opening (beats 0-6): minor drone, two heavy hits, letters falling / vanishing
put(pad([D/2, D/2*1.2, D*0.75], 6*BEAT, 1*BEAT, 0.3), 0, 0.45)
for b in (0, 3):
    put(clap(), b, 0.3)
put(boom(1.6, 42, 2.0), 1, 1.0)
put(fall(1.2), 2, 0.9)                       # 무너진 사회 falls
put(boom(1.6, 40, 2.0), 4, 0.95)
put(riser(1, 2000, 300), 5, 0.45)            # 사라진 사회 fades (downward air)
put(riser(1), 5, 0.55)                       # swell into the drop

# Drums enter on 그래서 (beat 6)
for b in range(6, 16):
    put(kick(), b, 0.85)
    put(hat(), b + 0.5, 0.22, pan=0.3)
BIG  = [6, 8, 11, 13, 15]
SOFT = [7, 9, 12, 14]
for b in BIG:
    put(boom(), b, 0.95); put(clap(), b, 0.75)
for b in SOFT:
    put(clap(), b, 0.35)
# 다시 세우는: rising plucks as the words rise, major chord opens up
put(pluck(D), 10, 0.55, pan=-0.3); put(pluck(D*1.5), 10.5, 0.55, pan=0.3)
put(pad([D/2, D*0.75, D*1.25], 3*BEAT, 0.2, 0.6), 9, 0.32)
put(riser(1), 7, 0.45); put(riser(1), 12, 0.45)
for k in range(4):                           # 16th build under soon.
    put(hat(), 15 + k/4, 0.45, pan=-0.3 if k % 2 else 0.3); put(clap(), 15 + k/4, 0.25 + 0.12*k)
put(riser(1, 400, 10000), 15, 0.8)

FINAL = 16                                   # logo lands
put(boom(2.6, 40, 1.5), FINAL, 1.2); put(clap(), FINAL, 0.7)
put(pad([D/2, D*0.75, D, D*1.25, D*1.5], 3*BEAT, 0.01, 2.2), FINAL, 0.6)
for i, m in enumerate([1.0, 1.25, 1.5, 2.0]):
    put(pluck(D*m*2, 1.4), FINAL + i*0.5, 0.22, pan=-0.4+i*0.27)

def room(x, secs=1.6, wet=0.10):
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
