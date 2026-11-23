import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SlotMachineDefinition } from './slot-machine.model';

export interface WinningPayline {
  number: number;
  symbol: number;
  matches: number;
  rows: number[];
  winCents: number;
}

export interface SlotGameState {
  reels: number[][];
  reelSpinning: boolean[];
  reelsWin: boolean;
  winningCells: boolean[][];
  winningPaylines: WinningPayline[];
  activePayline: number | null;
  message: string;
  bets: number[];
  bet: number;
  totalBet: number;
  busy: boolean;
  credits: number;
}

@Component({
  selector: 'app-slot-machine',
  templateUrl: './slot-machine.component.html',
})
export class SlotMachineComponent {
  @Input({ required: true }) machine!: SlotMachineDefinition;
  @Input({ required: true }) state!: SlotGameState;

  @Output() readonly spin = new EventEmitter<void>();
  @Output() readonly betChange = new EventEmitter<number>();

  protected readonly symbolIndexes = [0, 1, 2, 3, 4, 5];
  private readonly payouts = [5, 8, 15, 25, 50, 100];

  protected symbol(index: number): string {
    return this.machine.symbols[index];
  }

  protected symbolLine(index: number): string {
    return this.symbol(index).repeat(this.machine.reelCount);
  }

  protected isMultiLine(): boolean {
    return this.machine.paylines.length > 1;
  }

  protected hasCherryPayline(): boolean {
    return this.machine.reelCount >= 5 && this.machine.symbols[0] === '🍒';
  }

  protected hasLineWin(): boolean {
    return this.state.winningCells.some((reel) => reel.some(Boolean));
  }

  protected isPaylineRow(index: number): boolean {
    return index === Math.floor(this.machine.rowCount / 2);
  }

  protected payout(index: number): number {
    return this.payouts[index];
  }

  protected payoutLabel(index: number): string {
    if (index === 0 && this.machine.symbols[0] === '🍒') {
      const count = this.machine.reelCount >= 5 ? 3 : 2;
      return `Any ${count} ${this.symbol(index)} 2×`;
    }
    if (!this.isMultiLine()) return `${this.symbolLine(index)} ${this.payout(index)}×`;
    const reelMultiplier = this.machine.reelCount >= 5 ? 5 : 1;
    return `${this.symbol(index)} ${this.payout(index) * reelMultiplier}×`;
  }

  protected betLabel(value: number): string {
    return value < 1 ? `${Math.round(value * 100)}¢` : `$${value}`;
  }

  protected formatMoney(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
}
