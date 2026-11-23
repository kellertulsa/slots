import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SlotMachineDefinition } from './slot-machine.model';

@Component({
  selector: 'app-slot-card',
  templateUrl: './slot-card.component.html',
})
export class SlotCardComponent {
  @Input({ required: true }) machine!: SlotMachineDefinition;
  @Output() readonly open = new EventEmitter<string>();
}
