import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseManagerComponent } from './expense-manager.component';

describe('ExpenseManagerComponent', () => {
  let component: ExpenseManagerComponent;
  let fixture: ComponentFixture<ExpenseManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
