import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestVerificationComponent } from './request-verification.component';

describe('RequestVerificationComponent', () => {
  let component: RequestVerificationComponent;
  let fixture: ComponentFixture<RequestVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
