import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatFullName, formatLifespan, type Gender } from '../../../model/interfaces';
import { NodeHeaderComponent } from '../node-header/node-header.component';

@Component({
  selector: 'app-compact-node',
  imports: [NodeHeaderComponent],
  templateUrl: './compact-node.component.html',
  styleUrls: ['./compact-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactNodeComponent {
  firstName = input<string>();
  lastName = input<string>();
  gender = input<Gender>();
  birthYear = input<number>();
  deathYear = input<number>();
  color = input<string>();

  spouseFirstName = input<string>();
  spouseLastName = input<string>();
  spouseGender = input<Gender>();
  spouseBirthYear = input<number>();
  spouseDeathYear = input<number>();

  protected readonly fullName = computed(() => formatFullName(this.firstName(), this.lastName()));
  protected readonly spouseFullName = computed(() =>
    formatFullName(this.spouseFirstName(), this.spouseLastName()),
  );
  protected readonly lifespan = computed(() => formatLifespan(this.birthYear(), this.deathYear()));
  protected readonly spouseLifespan = computed(() =>
    formatLifespan(this.spouseBirthYear(), this.spouseDeathYear()),
  );
}
