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

# Acoustic version: plucked-string physical model (guitar, harp, bass) + cajon. Same beat map as reel3.html.
def ks(freq, dur=2.5, bright=0.5, decay=0.996, pick=0.2, vel=1.0):
    """Karplus-Strong string: noise burst in a delay line with a damping average."""
    n = int(SR*dur); P_ = SR/freq; L_ = int(P_); frac = P_-L_
    exc = rng.uniform(-1, 1, L_+1)
    exc = lp(exc, 1500 + 7000*bright)                       # softer pick = darker
    k = max(1, int(L_*pick)); exc = exc - np.roll(exc, k)     # pick position comb
    buf = np.zeros(n + L_ + 2); buf[:L_+1] = exc
    for i in range(L_+1, n + L_ + 1):
        a = buf[i-L_-1]; b = buf[i-L_]
        buf[i] = decay*(0.5*(a+b) + 0.5*frac*(a-b)*0)          # averaging lowpass
    y = buf[L_+1:L_+1+n]
    t = np.arange(n)/SR
    return y*np.minimum(t/0.001,1)*vel*0.9
def body(x):                                                  # guitar body resonance
    return x + 0.35*lp(hp(x, 90), 260) + 0.15*lp(hp(x, 180), 500)
def guitar(freq, dur=2.6, vel=1.0, bright=0.45): return body(ks(freq, dur, bright, 0.9965, 0.18, vel))
def harp(freq, dur=3.0, vel=1.0):  return ks(freq, dur, 0.75, 0.9985, 0.5, vel)*0.8
def bass(freq, dur=2.0, vel=1.0):  return lp(ks(freq, dur, 0.2, 0.998, 0.3, vel), 900)*1.4
def strum(notes, b, vel=0.8, down=True, gap=0.012, dur=2.4, bright=0.45):
    ns = notes if down else notes[::-1]
    for i, f in enumerate(ns):
        put(guitar(f, dur, vel*(1-0.05*i), bright), b + (i*gap)/BEAT, 0.5, pan=-0.3+0.6*i/max(len(ns)-1,1))
def cajon_low():
    t = t_(0.35); f = 70 + 50*np.exp(-t*30)
    return (np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9) + lp(rng.standard_normal(len(t)),400)*np.exp(-t*25)*0.4)
def cajon_slap():
    t = t_(0.18); return (hp(lp(rng.standard_normal(len(t)), 5000), 900)*np.exp(-t*28) + np.sin(2*np.pi*230*t)*np.exp(-t*30)*0.3)*0.7
def shaker():
    t = t_(0.07); return hp(rng.standard_normal(len(t)), 5000)*np.exp(-t*55)*0.4

E2,A2,D3,F3,G3,A3,B3 = 82.41,110.0,146.83,174.61,196.0,220.0,246.94
C4,D4,E4,F4,Fs4,G4,A4,B4,Cs5,D5,E5,Fs5,A5,D6 = 261.63,293.66,329.63,349.23,369.99,392.0,440.0,493.88,554.37,587.33,659.25,739.99,880.0,1174.66
D2 = 73.42; G2 = 98.0; B2 = 123.47
Dm  = [D3, A3, D4, F4]
Dmaj= [D3, A3, D4, Fs4, A4]
Amaj= [A2, 164.81, A3, 277.18, E4]
Bm  = [B2, Fs4/2, B3, D4, Fs4]
Gmaj= [G2, D3, G3, B3, D4]

# Dark opening (0-6): sparse D minor, low bass hits, falling harp, vanishing harmonics
for i, f in enumerate([D3, A3, D4, F4, A4, F4]):
    put(guitar(f, 2.4, 0.8, 0.35), i*0.5, 1.2)        # slow fingerpicked Dm, one note per half-beat (0-3)
put(bass(D2, 2.2, 1.0), 1, 2.2); put(guitar(D3, 2.0, 1.0, 0.25), 1, 0.9)
for i, f in enumerate([A4, G4, F4, E4, D4]):           # letters fall: harp steps down
    put(harp(f, 2.0, 0.9), 2 + i*3/28, 1.1)
for i, f in enumerate([D3, A3, D4, F4, A4, D5]):
    put(guitar(f, 2.2, 0.8, 0.35), 3 + i*0.5, 1.1)
put(bass(D2*0.9439, 2.2, 1.0), 4, 2.2); put(guitar(D3*0.9439, 2.0, 1.0, 0.25), 4, 0.9)                 # C#2: tension
for i, f in enumerate([D5, F4*2, A5]):                   # letters vanish: soft high harp, fading
    put(harp(f, 1.6, 0.7), 5 + i/3, 0.7)

# Turn (6): open D major strum, cajon groove starts
prog = [Dmaj, Amaj, Bm, Gmaj, Dmaj]
for k, b in enumerate(range(6, 16, 2)):
    ch = prog[k % len(prog)]
    strum(ch, b, 0.95, True)                             # down on the beat
    strum(ch[1:], b + 0.5, 0.45, False, 0.008, 1.2)      # light up-strum
    strum(ch, b + 1, 0.7, True)
    strum(ch[1:], b + 1.5, 0.4, False, 0.008, 1.2)
put(bass(D2, 2.0, 1.0), 6, 1.8)
for b, f in [(8, A2), (10, B2), (12, G2), (14, D2*2)]:
    put(bass(f, 2.0, 0.9), b, 1.6)
for b in range(6, 16):
    put(cajon_low(), b, 0.75)
    if b % 2: put(cajon_slap(), b, 0.6)
    put(shaker(), b + 0.5, 0.35, pan=0.3)
# Bold lines: harp accents
for b, f in [(6, A5), (8, D5), (11, D6), (13, Fs5), (15, A5)]:
    put(harp(f, 2.4, 0.9), b, 0.42)
for b, f in [(10, D5), (10.5, A5)]:                      # 다시 · 세우는 rise
    put(harp(f, 2.6, 1.0), b, 0.5); put(harp(f/2, 2.6, 0.6), b, 0.3)
for k in range(4):                                       # build: 16th muted strums
    strum([D3, A3, D4], 15 + k/4, 0.35 + 0.12*k, k % 2 == 0, 0.006, 0.25, 0.3)

FINAL = 16
# Logo: big let-ring D major strum, low D, harp arpeggio up
strum([D2*2, A2*2, D4/1, Fs4, A4, D5], FINAL, 1.0, True, 0.02, 4.0, 0.5)
put(bass(D2, 3.5, 1.0), FINAL, 1.8)
for i, f in enumerate([D5, Fs5, A5, D6]):
    put(harp(f, 3.0, 0.8), FINAL + 0.25 + i*0.25, 0.38, pan=-0.3+i*0.2)

def room(x, secs=1.8, wet=0.16):
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
