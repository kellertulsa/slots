import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { SlotCardComponent } from './slot-card.component';
import {
  AlexSlotComponent,
  HelenSlotComponent,
  PersephoneSlotComponent,
  RyanSlotComponent,
} from './slots/slot-components';
import { SlotGameState, WinningPayline } from './slot-machine.component';
import { SLOT_MACHINES, SlotMachineDefinition } from './slot-machine.model';

@Component({
  imports: [
    SlotCardComponent,
    HelenSlotComponent,
    RyanSlotComponent,
    AlexSlotComponent,
    PersephoneSlotComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  @ViewChild('machineTrack') private machineTrack?: ElementRef<HTMLDivElement>;

  protected readonly credits = signal(100);
  protected readonly bet = signal(5);
  protected readonly busy = signal(false);
  protected readonly message = signal('Pick a bet and spin.');
  protected readonly home = signal(true);
  protected readonly activeMachine = signal<SlotMachineDefinition | null>(null);
  protected readonly reels = signal<number[][]>([]);
  protected readonly reelSpinning = signal<boolean[]>([]);
  protected readonly reelsWin = signal(false);
  protected readonly winningCells = signal<boolean[][]>([]);
  protected readonly winningPaylines = signal<WinningPayline[]>([]);
  protected readonly activePayline = signal<number | null>(null);
  protected readonly modalOpen = signal(false);
  protected readonly modalMessage = signal('Ways to keep playing.');
  private readonly cooldownNow = signal(Date.now());
  protected readonly catchOpen = signal(false);
  protected readonly catchWon = signal(false);
  protected readonly bucketLane = signal(1);
  protected readonly jewels = signal<{ lane: number; top: number; value: number; catching: boolean; delay: number }[]>([
    { lane: 0, top: -12, value: 40, catching: false, delay: 0 },
    { lane: 1, top: -12, value: 80, catching: false, delay: 1000 },
    { lane: 2, top: -12, value: 200, catching: false, delay: 2000 },
  ]);
  protected readonly bigWin = signal<{ win: number; multiplier: number; jackpot: boolean } | null>(null);
  protected readonly bigWinAmount = signal(0);
  protected readonly machines = SLOT_MACHINES;

  protected gameState(): SlotGameState {
    const machine = this.activeMachine();
    return {
      reels: this.reels(),
      reelSpinning: this.reelSpinning(),
      reelsWin: this.reelsWin(),
      winningCells: this.winningCells(),
      winningPaylines: this.winningPaylines(),
      activePayline: this.activePayline(),
      message: this.message(),
      bets: machine?.betOptions ?? [],
      bet: this.bet(),
      totalBet: machine ? this.wagerCents(machine, this.bet()) / 100 : this.bet(),
      busy: this.busy(),
      credits: this.credits(),
    };
  }

  private readonly weights = [6, 5, 4, 3, 2, 1];
  private readonly payouts = [5, 8, 15, 25, 50, 100];
  private readonly totals = 21;
  private catchTimer: ReturnType<typeof setInterval> | null = null;
  private catchFrame: number | null = null;
  private catchStarted = 0;
  private catchPrize = 0;
  private catchWinTimer: ReturnType<typeof setTimeout> | null = null;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  private paylineTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly audioGestureEvent = 'PointerEvent' in window ? 'pointerdown' : 'touchstart';
  protected catchDailyUntil = 0;
  protected catchGameUntil = 0;
  private audio: AudioContext | null = null;

  ngOnInit(): void {
    try {
      const saved = Number.parseFloat(localStorage.getItem('brass.credits') ?? '');
      if (Number.isFinite(saved) && saved >= 0) this.credits.set(saved);
    } catch {}

    this.route();
    window.addEventListener('hashchange', this.route);
    document.addEventListener(this.audioGestureEvent, this.activateAudio, true);
    if (this.credits() < 1) setTimeout(() => this.openModal(), 300);
  }

  ngOnDestroy(): void {
    window.removeEventListener('hashchange', this.route);
    document.removeEventListener(this.audioGestureEvent, this.activateAudio, true);
    this.stopTimers();
  }

  private readonly route = (): void => {
    const id = window.location.hash.slice(1);
    const machine = this.machines.find((item) => item.id === id);
    if (!machine) {
      this.home.set(true);
      this.activeMachine.set(null);
      this.reels.set([]);
      this.reelSpinning.set([]);
      document.body.className = '';
      return;
    }
    this.home.set(false);
    this.activeMachine.set(machine);
    if (!machine.betOptions.includes(this.bet())) this.bet.set(machine.betOptions[0]);
    this.drawInitialReels(machine);
    this.reelSpinning.set(Array.from({ length: machine.reelCount }, () => false));
    this.winningCells.set(this.emptyWinningCells(machine));
    this.winningPaylines.set([]);
    this.cancelPaylineSequence(machine);
    document.body.className = machine.theme;
  };

  protected goHome(): void {
    if (!this.busy()) window.location.hash = 'home';
  }

  protected openMachine(id: string): void {
    window.location.hash = id;
  }

  protected scrollMachines(direction: -1 | 1): void {
    const track = this.machineTrack?.nativeElement;
    const card = track?.querySelector<HTMLElement>('.card');
    if (!track || !card) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: 'smooth',
    });
  }

  protected selectBet(value: number): void {
    const machine = this.activeMachine();
    if (!this.busy() && machine?.betOptions.includes(value)) this.bet.set(value);
  }

  protected formatMoney(amount: number): string {
    return Number.isInteger(amount) ? amount.toLocaleString('en-US') : amount.toFixed(2);
  }

  private drawInitialReels(machine: SlotMachineDefinition): void {
    this.reels.set(Array.from({ length: machine.reelCount }, () =>
      Array.from({ length: machine.rowCount }, () => this.randomSymbol()),
    ));
  }

  private randomSymbol(): number {
    let r = Math.random() * this.totals;
    for (let i = 0; i < this.weights.length; i++) {
      if (r < this.weights[i]) return i;
      r -= this.weights[i];
    }
    return 0;
  }

  private randomAny(symbolCount: number): number {
    return Math.floor(Math.random() * symbolCount);
  }

  private emptyWinningCells(machine: SlotMachineDefinition): boolean[][] {
    return Array.from({ length: machine.reelCount }, () =>
      Array.from({ length: machine.rowCount }, () => false),
    );
  }

  private cancelPaylineSequence(machine: SlotMachineDefinition): void {
    if (this.paylineTimer) clearTimeout(this.paylineTimer);
    this.paylineTimer = null;
    this.activePayline.set(null);
    this.winningCells.set(this.emptyWinningCells(machine));
  }

  private showNextPayline(
    machine: SlotMachineDefinition,
    paylines: WinningPayline[],
    index: number,
  ): void {
    if (index >= paylines.length) {
      this.paylineTimer = null;
      this.activePayline.set(null);
      this.winningCells.set(this.emptyWinningCells(machine));
      return;
    }

    const payline = paylines[index];
    const cells = this.emptyWinningCells(machine);
    for (let reelIndex = 0; reelIndex < payline.rows.length; reelIndex++) {
      cells[reelIndex][payline.rows[reelIndex]] = true;
    }
    this.activePayline.set(payline.number);
    this.winningCells.set(cells);
    this.paylineTimer = setTimeout(
      () => this.showNextPayline(machine, paylines, index + 1),
      1000,
    );
  }

  private wagerCents(machine: SlotMachineDefinition, bet: number): number {
    return Math.round(bet * 100) * machine.paylines.length;
  }

  protected spin(): void {
    if (this.busy()) return;
    const machine = this.activeMachine();
    if (!machine) return;
    const creditsCents = Math.round(this.credits() * 100);
    const minimumWager = this.wagerCents(machine, machine.betOptions[0]);
    if (creditsCents < minimumWager) {
      this.openModal();
      return;
    }

    if (creditsCents < this.wagerCents(machine, this.bet())) {
      if (machine.paylines.length === 1) {
        this.bet.set(creditsCents / 100);
      } else {
        const affordableBet = machine.betOptions
          .filter((option) => this.wagerCents(machine, option) <= creditsCents)
          .pop();
        if (affordableBet === undefined) {
          this.openModal();
          return;
        }
        this.bet.set(affordableBet);
      }
    }

    const wagerCents = this.wagerCents(machine, this.bet());
    this.credits.update((value) => (Math.round(value * 100) - wagerCents) / 100);
    this.busy.set(true);
    this.reelsWin.set(false);
    this.winningCells.set(this.emptyWinningCells(machine));
    this.winningPaylines.set([]);
    this.cancelPaylineSequence(machine);
    this.save();
    this.message.set('Spinning…');
    this.beep(220, 0.08);

    let result = Array.from({ length: machine.reelCount }, () =>
      Array.from({ length: machine.rowCount }, () => this.randomSymbol()),
    );
    try {
      if (!localStorage.getItem('brass.demo1')) {
        localStorage.setItem('brass.demo1', '1');
        result.forEach((reel) => (reel[Math.floor(machine.rowCount / 2)] = 3));
      }
    } catch {}

    result.forEach((reelResult, reelIndex) => {
      this.reelSpinning.update((spinning) =>
        spinning.map((active, index) => (index === reelIndex ? true : active)),
      );
      const interval = setInterval(() => {
        this.reels.update((reels) => reels.map((reel, index) =>
          index === reelIndex
            ? [this.randomAny(machine.symbols.length), ...reel.slice(0, machine.rowCount - 1)]
            : reel,
        ));
      }, 70);

      setTimeout(() => {
        clearInterval(interval);
        this.reels.update((reels) => reels.map((reel, index) =>
          index === reelIndex
            ? reelResult
            : reel,
        ));
        this.reelSpinning.update((spinning) =>
          spinning.map((active, index) => (index === reelIndex ? false : active)),
        );
        this.beep(330 + reelIndex * 110, 0.1);
        if (reelIndex === result.length - 1) this.evaluate(result);
      }, 800 + reelIndex * 500);
    });
  }

  private evaluate(result: number[][]): void {
    const machine = this.activeMachine();
    if (!machine) return;

    const winningCells = this.emptyWinningCells(machine);
    const winningPaylines: WinningPayline[] = [];
    const lineBetCents = Math.round(this.bet() * 100);
    let winCents = 0;
    if (machine.paylines.length === 1) {
      const centerRow = Math.floor(machine.rowCount / 2);
      const line = result.map((reel) => reel[centerRow]);
      const cherries = line.filter((value) => value === 0).length;
      if (machine.reelCount >= 5 && cherries >= 3) {
        winCents = lineBetCents * 2;
        line.forEach((value, reelIndex) => {
          if (value === 0) winningCells[reelIndex][centerRow] = true;
        });
      } else if (machine.reelCount < 5 && cherries >= 2) {
        winCents = lineBetCents * 2;
        line.forEach((value, reelIndex) => {
          if (value === 0) winningCells[reelIndex][centerRow] = true;
        });
      } else if (line.length > 0 && line[0] !== 0 && line.every((value) => value === line[0])) {
        winCents = lineBetCents * this.payouts[line[0]];
        line.forEach((_, reelIndex) => (winningCells[reelIndex][centerRow] = true));
      }
    } else {
      for (const [paylineIndex, payline] of machine.paylines.entries()) {
        const line = payline.map((row, reelIndex) => result[reelIndex][row]);
        const cherries = line.filter((symbol) => symbol === 0).length;
        const cherryThreshold = machine.reelCount >= 5 ? 3 : 2;
        if (cherries >= cherryThreshold) {
          const lineWinCents = lineBetCents * 2;
          winCents += lineWinCents;
          winningPaylines.push({
            number: paylineIndex + 1,
            symbol: 0,
            matches: cherries,
            rows: [...payline],
            winCents: lineWinCents,
          });
          for (let reelIndex = 0; reelIndex < payline.length; reelIndex++) {
            winningCells[reelIndex][payline[reelIndex]] = true;
          }
          continue;
        }

        const symbol = line[0];
        if (symbol === 0) continue;
        let matches = 1;
        while (
          matches < machine.reelCount
          && line[matches] === symbol
        ) {
          matches++;
        }
        if (matches < machine.reelCount) continue;

        const reelMultiplier = machine.reelCount >= 5 ? 5 : 1;
        const lineWinCents = lineBetCents * this.payouts[symbol] * reelMultiplier;
        winCents += lineWinCents;
        winningPaylines.push({
          number: paylineIndex + 1,
          symbol,
          matches,
          rows: [...payline],
          winCents: lineWinCents,
        });
        for (let reelIndex = 0; reelIndex < matches; reelIndex++) {
          winningCells[reelIndex][payline[reelIndex]] = true;
        }
      }
    }
    this.winningCells.set(winningCells);
    this.winningPaylines.set(winningPaylines);
    if (machine.paylines.length > 1 && winningPaylines.length > 0) {
      this.showNextPayline(machine, winningPaylines, 0);
    }
    const win = winCents / 100;
    const totalWager = this.wagerCents(machine, this.bet()) / 100;

    if (win > 0) {
      this.credits.update((value) => (Math.round(value * 100) + winCents) / 100);
      this.reelsWin.set(true);
      this.message.set(`You won $${this.formatMoney(win)}!`);
      [523, 659, 784, 1047].forEach((frequency, index) =>
        setTimeout(() => this.beep(frequency, 0.18, 'triangle', 0.25), index * 110),
      );
      if (win >= totalWager * 25) {
        setTimeout(() => this.bigWin.set({
          win,
          multiplier: Math.round(win / totalWager),
          jackpot: win >= totalWager * 100,
        }), machine.paylines.length > 1 ? winningPaylines.length * 1000 + 600 : 600);
      }
    } else {
      this.message.set(
        Math.round(this.credits() * 100) < this.wagerCents(machine, machine.betOptions[0])
          ? 'Out of money.'
          : 'No win. Spin again.',
      );
    }
    this.save();
    this.busy.set(false);
    if (Math.round(this.credits() * 100) < this.wagerCents(machine, machine.betOptions[0])) {
      setTimeout(() => this.openModal(), 900);
    }
  }

  protected openModal(): void {
    if (this.busy()) return;
    this.modalOpen.set(true);
    this.cooldownNow.set(Date.now());
    if (!this.cooldownTimer) {
      this.cooldownTimer = setInterval(() => this.cooldownNow.set(Date.now()), 1000);
    }
    const machine = this.activeMachine();
    const outOfMoney = machine
      ? Math.round(this.credits() * 100) < this.wagerCents(machine, machine.betOptions[0])
      : this.credits() < 1;
    this.modalMessage.set(
      outOfMoney
        ? 'You are out of money. Pick a free way to keep playing.'
        : 'Ways to keep playing.',
    );
  }

  protected closeModal(): void {
    if (this.catchOpen()) return;
    this.modalOpen.set(false);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = null;
  }

  protected dailyReady(): boolean {
    return this.cooldownNow() >= this.catchDailyUntil;
  }

  protected gameReady(): boolean {
    return this.cooldownNow() >= this.catchGameUntil;
  }

  protected claimDaily(): void {
    if (!this.dailyReady()) return;
    this.catchDailyUntil = Date.now() + 86400000;
    this.award(1000);
  }

  protected startCatchGame(): void {
    if (!this.gameReady()) return;
    this.catchOpen.set(true);
    this.catchWon.set(false);
    this.catchPrize = 0;
    this.catchStarted = Date.now();
    this.catchGameUntil = Date.now() + 60000;
    this.bucketLane.set(1);
    this.jewels.set(this.createCatchJewels());
    this.catchTimer = setInterval(() => {
      const seconds = Math.max(0, 15 - (Date.now() - this.catchStarted) / 1000);
      if (seconds <= 0) this.finishCatch(false);
    }, 100);
    this.animateJewels();
  }

  protected setBucketLane(event: PointerEvent): void {
    if (!this.catchOpen() || this.catchWon()) return;
    const field = event.currentTarget as HTMLElement;
    const bounds = field.getBoundingClientRect();
    const lane = Math.max(0, Math.min(2, Math.floor(((event.clientX - bounds.left) / bounds.width) * 3)));
    this.bucketLane.set(lane);
  }

  private animateJewels(): void {
    let animationStarted: number | null = null;
    const frame = (timestamp: number): void => {
      if (!this.catchOpen()) return;
      animationStarted ??= timestamp;
      const elapsed = timestamp - animationStarted;
      let allCaught = false;
      this.jewels.update((jewels) => jewels.map((jewel) => {
        if (jewel.catching) return jewel;
        if (elapsed < jewel.delay) return jewel;
        const top = -12 + (elapsed - jewel.delay) / 35;
        if (top >= 76 && jewel.lane === this.bucketLane()) {
          this.catchPrize = [40, 80, 200, 500][Math.floor(Math.random() * 4)];
          allCaught = true;
          return { ...jewel, top: 76, catching: true };
        }
        return { ...jewel, top };
      }));
      if (allCaught) {
        this.finishCatch(true);
        return;
      }
      this.catchFrame = requestAnimationFrame(frame);
    };
    this.catchFrame = requestAnimationFrame(frame);
  }

  private createCatchJewels() {
    const lanes = [0, 1, 2];
    for (let index = lanes.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [lanes[index], lanes[swapIndex]] = [lanes[swapIndex], lanes[index]];
    }

    return lanes.map((lane, index) => ({
      lane,
      top: -12,
      value: [40, 80, 200][lane],
      catching: false,
      delay: index * 1000,
    }));
  }

  private finishCatch(won: boolean): void {
    if (!this.catchOpen()) return;
    if (this.catchFrame !== null) cancelAnimationFrame(this.catchFrame);
    if (this.catchTimer !== null) clearInterval(this.catchTimer);
    this.catchFrame = null;
    this.catchTimer = null;
    if (!won) {
      this.catchOpen.set(false);
      return;
    }

    this.catchWon.set(true);
    this.award(this.catchPrize || 40);
    this.catchWinTimer = setTimeout(() => {
      this.catchWon.set(false);
      this.catchOpen.set(false);
      this.catchWinTimer = null;
    }, 3000);
  }

  private award(amount: number): void {
    this.credits.update((value) => value + amount);
    this.save();
    this.modalMessage.set(`$${amount.toLocaleString('en-US')} added. Close this to keep playing.`);
    this.beep(784, 0.15, 'triangle', 0.25);
  }

  protected collectBigWin(): void {
    this.bigWin.set(null);
  }

  protected formatCooldown(until: number): string {
    const seconds = Math.max(0, Math.ceil((until - this.cooldownNow()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  private save(): void {
    try {
      localStorage.setItem('brass.credits', String(this.credits()));
    } catch {}
  }

  private stopTimers(): void {
    if (this.catchTimer) clearInterval(this.catchTimer);
    if (this.catchFrame) cancelAnimationFrame(this.catchFrame);
    if (this.catchWinTimer) clearTimeout(this.catchWinTimer);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    if (this.paylineTimer) clearTimeout(this.paylineTimer);
  }

  private readonly activateAudio = (): void => {
    try {
      const audio = this.getAudioContext();
      if (audio.state === 'running') return;

      const resume = audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.01);
      void resume.catch((error: unknown) => console.error('Unable to resume slot audio.', error));
    } catch (error) {
      console.error('Unable to activate slot audio.', error);
    }
  };

  private getAudioContext(): AudioContext {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('Web Audio is not supported by this browser.');
    if (!this.audio || this.audio.state === 'closed') this.audio = new AudioContextConstructor();
    return this.audio;
  }

  private beep(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.2): void {
    try {
      const audio = this.getAudioContext();
      if (audio.state !== 'running') {
        void audio.resume()
          .catch((error: unknown) => console.error('Unable to resume slot audio.', error));
      }
      this.playTone(audio, frequency, duration, type, volume);
    } catch (error) {
      console.error('Unable to play slot audio.', error);
    }
  }

  private playTone(
    audio: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
