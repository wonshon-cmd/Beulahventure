"""Original soundtrack for the Beulah reel, locked to the same beat grid as reel.html.
1 beat = 16 frames at 30 fps = 0.5333 s (112.5 BPM). Every sound starts exactly on a beat or an 8th/16th of a beat."""
import sys, wave
import numpy as np

SR = 48000
BEAT = 16 / 30
TOTAL_BEATS = 23
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

# Beat map (same as reel.html)
BIG   = [0, 1, 3, 4, 5, 12, 14, 15, 16, 17, 18, 19]   # slam cuts
SOFT  = [2, 11, 13]                                  # thin first lines
FLASH = [6, 6.5, 7, 7.5]                             # 소명 · 정직 · 동행 · 열매
GROW  = [8.5, 9, 9.5, 10]                            # seed -> tree
FINAL = 20                                           # !!!

for b in range(0, 20):                               # kick on every beat, hat on every off-beat
    put(kick(), b, 0.85)
    put(hat(), b + 0.5, 0.22, pan=0.3)
for b in BIG:
    put(boom(), b, 0.95); put(clap(), b, 0.75)
for b in SOFT:
    put(clap(), b, 0.35)
for b in FLASH:
    put(clap(), b, 0.8); put(hat(), b, 0.35, pan=-0.3)
D = 293.66
put(whoosh(3), 8, 0.55)
for b, m in zip(GROW, [1.0, 1.25, 1.5, 2.0]):
    put(pluck(D*m), b, 0.5, pan=(m-1.5)*0.6)
put(pad([D/2, D*0.75, D*1.25], 3*BEAT, 0.3, 0.4), 8, 0.3)
put(riser(1), 2, 0.5)            # into 가치.
put(riser(1), 11, 0.5)           # into 들려주세요.
put(riser(1), 13, 0.5)           # into 투자까지.
for k in range(8):               # 16th hats over 신청하세요
    put(hat(), 19 + k/8, 0.35, pan=-0.3 if k % 2 else 0.3)
put(riser(1, 400, 10000), 19, 0.8)
put(boom(2.2, 40, 1.8), FINAL, 1.4); put(clap(), FINAL, 1.0)
put(pad([D/2, D*0.75, D, D*1.25, D*1.5], 3*BEAT, 0.02, 1.4), FINAL, 0.55)
for i, m in enumerate([1.0, 1.25, 1.5, 2.0]):
    put(pluck(D*m*2, 1.0), FINAL + i*0.25, 0.25, pan=-0.4+i*0.27)

def room(x, secs=1.6, wet=0.10):
    ir_t = t_(secs); ir = lp(rng.standard_normal(len(ir_t))*np.exp(-ir_t*3.5), 5000)
    ir /= np.sqrt((ir**2).sum()); n = len(x)+len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n)*np.fft.rfft(ir, n), n)[:len(x)]
    return x*(1-wet) + y*wet*2
L = room(L); R = room(R)
mix = np.tanh(np.stack([L, R], 1)*0.9)
fl = int(0.6*SR); mix[-fl:] *= np.linspace(1, 0, fl)[:, None]
mix /= np.abs(mix).max()/0.75
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok seconds', N/SR)
