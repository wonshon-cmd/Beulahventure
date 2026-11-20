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

# Clear, bell-like version — same beat map as reel3.html (no distortion, no saw pads)
def bell(freq, dur=2.5, vel=1.0):
    t = t_(dur); s = np.zeros(len(t))
    for r, a, d in [(1.0,1.0,1.4),(2.0,0.35,2.4),(2.76,0.25,3.2),(5.4,0.08,6.0)]:
        s += a*np.sin(2*np.pi*freq*r*t)*np.exp(-t*d)
    return s*vel*np.minimum(t/0.002,1)*0.45
def glass_pad(freqs, dur, attack, release):
    t = t_(dur); s = np.zeros(len(t))
    for f in freqs:
        for d in (-0.15, 0.15):
            s += np.sin(2*np.pi*f*(1+d/100)*t) + 0.2*np.sin(4*np.pi*f*(1+d/100)*t)
    s /= len(freqs)*2.4
    env = np.clip(np.minimum(t/attack,1)*np.minimum((dur-t)/release,1),0,1)
    return s*env*(1+0.04*np.sin(2*np.pi*5*t))
def timp(f=55, dur=1.6):
    t = t_(dur); f_ = f*(1+0.15*np.exp(-t*30))
    return np.sin(2*np.pi*np.cumsum(f_)/SR)*np.exp(-t*3.2)*np.minimum(t/0.003,1)
def softkick():
    t = t_(0.28); f = 48 + 55*np.exp(-t*40)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*11)
def shaker():
    t = t_(0.06); return hp(rng.standard_normal(len(t)), 6000)*np.exp(-t*60)*0.5
def air(beats, up=True):
    dur = beats*BEAT; t = t_(dur); n = rng.standard_normal(len(t))
    c = 800*(10**(t/dur)) if up else 8000*(0.1**(t/dur))
    env = (t/dur)**2 if up else (1-t/dur)**2
    return hp(lp(n, c), 500)*env*0.35

D3, F3, A3, D4, E4, F4, G4, A4 = 146.83, 174.61, 220.0, 293.66, 329.63, 349.23, 392.0, 440.0
Fs4, B4, Cs5, D5, E5, Fs5, A5, D6 = 369.99, 493.88, 554.37, 587.33, 659.25, 739.99, 880.0, 1174.66

# Dark opening (0-6): soft D-minor glass pad, low timpani, bells
put(glass_pad([D3, F3, A3], 6*BEAT, 1.2*BEAT, 0.3), 0, 0.5)
put(bell(D4, 3.0, 0.6), 0, 0.5)
put(timp(55), 1, 0.9); put(bell(A4, 2.5, 0.8), 1, 0.45)
for i, n in enumerate([A4, G4, F4, E4, D4]):          # letters fall: descending bells
    put(bell(n, 1.6, 0.7), 2 + i*3/28, 0.38)
put(bell(F4, 3.0, 0.6), 3, 0.45)
put(timp(52), 4, 0.85); put(bell(D5, 2.5, 0.8), 4, 0.4)
put(air(1, up=False), 5, 0.6)                          # letters vanish
put(air(1, up=True), 5, 0.8)                           # breath in before the turn

# Turn (6): bright D-major bell chord, gentle groove begins
put(bell(D5, 3.0, 1.0), 6, 0.55); put(bell(Fs5, 3.0, 0.8), 6, 0.4); put(bell(A5, 3.0, 0.7), 6, 0.35)
put(timp(73), 6, 0.6)
for b in range(6, 16):
    put(softkick(), b, 0.55)
    put(shaker(), b + 0.5, 0.35, pan=0.3)
    if b % 2: put(shaker(), b, 0.2, pan=-0.3)
put(glass_pad([D3*2, Fs4, A4], 3*BEAT, 0.3, 0.6), 6, 0.3)
put(glass_pad([B4/2, D4, Fs4], 3*BEAT, 0.3, 0.6), 9, 0.3)
put(glass_pad([G4/2, B4/2*2, D4], 3*BEAT, 0.3, 0.6), 12, 0.3)
for b, n in [(7, A4), (8, D5), (9, B4), (11, D5), (12, A4), (13, Fs5), (14, E5), (15, A5)]:
    put(bell(n, 2.0, 0.9), b, 0.42)
for b, n in [(10, D5), (10.5, A5)]:                    # 다시 · 세우는 rise
    put(bell(n, 2.4, 1.0), b, 0.5); put(bell(n/2, 2.4, 0.6), b, 0.3)
for k in range(4):                                     # build into the logo
    put(bell([A4, B4, Cs5, D5][k], 0.9, 0.8), 15 + k/4, 0.35)
put(air(1, up=True), 15, 0.7)

FINAL = 16
put(timp(37, 2.4), FINAL, 0.75)
put(glass_pad([D3, A3, D4, Fs4, A4], 3*BEAT, 0.02, 2.4), FINAL, 0.45)
for i, n in enumerate([D5, Fs5, A5, D6]):
    put(bell(n, 3.2, 0.9), FINAL + i*0.12, 0.38, pan=-0.3+i*0.2)

def room(x, secs=2.6, wet=0.24):
    ir_t = t_(secs); ir = lp(rng.standard_normal(len(ir_t))*np.exp(-ir_t*3.5), 5000)
    ir /= np.sqrt((ir**2).sum()); n = len(x)+len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n)*np.fft.rfft(ir, n), n)[:len(x)]
    return x*(1-wet) + y*wet*2
L = room(L); R = room(R)
mix = np.stack([L, R], 1)
fl = int(1.2*SR); mix[-fl:] *= np.linspace(1, 0, fl)[:, None]**2   # slow fade over the logo
mix /= np.abs(mix).max()/0.75
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok seconds', N/SR)
