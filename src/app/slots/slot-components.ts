import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SlotMachineComponent, SlotGameState } from '../slot-machine.component';
import { SLOT_MACHINES_BY_ID, SlotMachineDefinition } from '../slot-machine.model';

const slotTemplate =
  '<app-slot-machine [machine]="machine" [state]="state" (spin)="spin.emit()" (betChange)="betChange.emit($event)" />';

@Component({
  imports: [SlotMachineComponent],
  selector: 'app-helen-slot',
  template: slotTemplate,
})
export class HelenSlotComponent {
  @Input({ required: true }) state!: SlotGameState;
  @Output() readonly spin = new EventEmitter<void>();
  @Output() readonly betChange = new EventEmitter<number>();
  protected readonly machine: SlotMachineDefinition = SLOT_MACHINES_BY_ID.helen;
}

@Component({
  imports: [SlotMachineComponent],
  selector: 'app-ryan-slot',
  template: slotTemplate,
})
export class RyanSlotComponent {
  @Input({ required: true }) state!: SlotGameState;
  @Output() readonly spin = new EventEmitter<void>();
  @Output() readonly betChange = new EventEmitter<number>();
  protected readonly machine: SlotMachineDefinition = SLOT_MACHINES_BY_ID.ryan;
}

@Component({
  imports: [SlotMachineComponent],
  selector: 'app-alex-slot',
  template: slotTemplate,
})
export class AlexSlotComponent {
  @Input({ required: true }) state!: SlotGameState;
  @Output() readonly spin = new EventEmitter<void>();
  @Output() readonly betChange = new EventEmitter<number>();
  protected readonly machine: SlotMachineDefinition = SLOT_MACHINES_BY_ID.alex;
}

@Component({
  imports: [SlotMachineComponent],
  selector: 'app-persephone-slot',
  template: slotTemplate,
})
export class PersephoneSlotComponent {
  @Input({ required: true }) state!: SlotGameState;
  @Output() readonly spin = new EventEmitter<void>();
  @Output() readonly betChange = new EventEmitter<number>();
  protected readonly machine: SlotMachineDefinition = SLOT_MACHINES_BY_ID.persephone;
}
