import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueNodeComponent } from './queue-node.component';

describe('QueueNodeComponent', () => {
  let component: QueueNodeComponent;
  let fixture: ComponentFixture<QueueNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueueNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
