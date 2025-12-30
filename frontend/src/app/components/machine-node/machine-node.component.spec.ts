import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineNodeComponent } from './machine-node.component';

describe('MachineNodeComponent', () => {
  let component: MachineNodeComponent;
  let fixture: ComponentFixture<MachineNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
