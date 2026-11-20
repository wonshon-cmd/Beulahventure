import sys, wave
import numpy as np

SR = 48000
DUR = 10.5
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def t_(sec): return np.arange(int(SR * sec)) / SR

def put(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i+len(s)] += s * (1 - max(pan, 0))
    R[i:i+len(s)] += s * (1 + min(pan, 0))

def onepole_lp(x, cutoff):
    # cutoff can be array (time-varying)
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2*np.pi*c/SR)
    y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        z = (1-a[i])*x[i] + a[i]*z; y[i] = z
    return y

def hp(x, cutoff): return x - onepole_lp(x, cutoff)

def kick(dur=0.45, f0=150, f1=42):
    t = t_(dur); f = f1 + (f0-f1)*np.exp(-t*28)
    ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7.5)

def boom(dur=1.8, f=46):
    t = t_(dur); f_ = f + 70*np.exp(-t*20)
    ph = 2*np.pi*np.cumsum(f_)/SR
    s = np.tanh(2.2*np.sin(ph))*np.exp(-t*2.3)
    crack = hp(rng.standard_normal(len(t)), 1800)*np.exp(-t*38)*0.9
    return s + crack

def hat(dur=0.05):
    t = t_(dur); return hp(rng.standard_normal(len(t)), 7000)*np.exp(-t*90)

def clap():
    t = t_(0.25); n = hp(rng.standard_normal(len(t)), 1200)
    env = np.exp(-t*30) + 0.6*np.exp(-np.maximum(t-0.012,0)*60)*(t>0.012) + 0.4*np.exp(-np.maximum(t-0.024,0)*60)*(t>0.024)
    return n*env*0.7

def riser(dur, f0=300, f1=6000):
    t = t_(dur); n = rng.standard_normal(len(t))
    cut = f0*(f1/f0)**(t/dur)
    return onepole_lp(n, cut)*(t/dur)**2*1.6

def whoosh(dur=1.2):
    t = t_(dur); n = rng.standard_normal(len(t))
    cut = 400 + 3000*np.sin(np.pi*t/dur)
    return onepole_lp(n, cut)*np.sin(np.pi*t/dur)**2*0.9

def pluck(freq, dur=0.9):
    t = t_(dur)
    s = np.sin(2*np.pi*freq*t) + 0.35*np.sin(2*np.pi*2*freq*t) + 0.15*np.sin(2*np.pi*3*freq*t)
    return s*np.exp(-t*5.5)*np.minimum(t/0.004,1)

def pad(freqs, dur, attack=0.6, release=1.5):
    t = t_(dur); s = np.zeros(len(t))
    for f in freqs:
        for d in (-0.35, 0.0, 0.35):
            ph = (f*(1+d/100))*t
            s += 2*(ph - np.floor(ph+0.5))
    s = onepole_lp(s/ (len(freqs)*3), 1400)
    env = np.minimum(t/attack, 1)*np.minimum((dur-t)/release, 1)
    return s*np.clip(env,0,1)

def reverb(x, secs=2.2, wet=0.25):
    ir_t = t_(secs); ir = rng.standard_normal(len(ir_t))*np.exp(-ir_t*3.2)
    ir = onepole_lp(ir, 5000); ir /= np.sqrt((ir**2).sum())
    n = len(x)+len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n)*np.fft.rfft(ir, n), n)[:len(x)]
    return x*(1-wet) + y*wet*2

# --- groove: kick every beat 0-7.5, offbeat hats
for b in np.arange(0, 7.5, 0.5):
    put(kick(), b, 0.9)
    put(hat(), b+0.25, 0.25, pan=0.3)
# flash words: 16th energy
for b in np.arange(3.0, 4.0, 0.125):
    put(hat(), b, 0.3, pan=-0.3 if int(b*8)%2 else 0.3)
for b in (3.0, 3.25, 3.5, 3.75):
    put(clap(), b, 0.7)

# --- big hits on slams
for at, g in [(0.0,1.0),(0.5,0.8),(1.5,1.1),(2.0,0.8),(2.5,0.85),(6.0,1.0),(7.0,1.0)]:
    put(boom(), at, g)
for at in (0.5, 2.0, 2.5, 6.0, 7.0):
    put(clap(), at, 0.8)

# --- risers into the biggest moments
put(riser(0.5), 1.0, 0.55)
put(riser(0.5), 5.5, 0.5)
put(riser(0.5), 7.0, 0.6)

# --- river scene: whoosh + growing plucks (D major, rising)
put(whoosh(1.4), 4.0, 0.6)
D = 293.66
for at, mult in [(4.5,1.0),(4.75,1.25),(5.0,1.5),(5.25,2.0)]:
    put(pluck(D*mult), at, 0.45, pan=(mult-1.5)*0.6)
put(pad([D/2, D*0.75, D*1.25], 1.6, 0.4, 0.5), 4.0, 0.35)

# --- final impact + hopeful chord
put(boom(2.6, 40), 7.5, 1.3)
put(clap(), 7.5, 0.9)
put(pad([D/2, D*0.75, D, D*1.25, D*1.5], 3.0, 0.15, 1.6), 7.5, 0.55)
for i, mult in enumerate([1.0, 1.25, 1.5, 2.0]):
    put(pluck(D*mult*2, 1.4), 7.65 + i*0.12, 0.25, pan=-0.4+i*0.27)

# --- master
L = reverb(L, wet=0.12); R = reverb(R, wet=0.12)
mix = np.stack([L, R], 1)
mix = onepole_lp(mix[:,0], 16000)[:,None]*0 + mix  # keep simple
mix = np.tanh(mix*0.9)
fade = np.ones(N); fl = int(0.8*SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:,None]
mix /= np.abs(mix).max()/0.75
pcm = (mix*32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', pcm.shape)
