import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cliennts } from './cliennts';

describe('Cliennts', () => {
  let component: Cliennts;
  let fixture: ComponentFixture<Cliennts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cliennts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cliennts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
