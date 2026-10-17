import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DriftsinfoService } from './../services/driftsinfo.service';
import { DriftsinfoCategories } from '../services/driftsinfo-status';

@Component({
  selector: 'app-forside',
  templateUrl: './forside.component.html',
  styleUrls: ['./forside.component.css'],
})
export class ForsideComponent implements OnInit {

  infos$: Observable<DriftsinfoCategories>;

  constructor(private driftinfoService: DriftsinfoService) { }

  // tslint:disable-next-line:typedef
  ngOnInit() {
    this.reloadInfo();
  }

  reloadInfo(): void {
    this.infos$ = this.driftinfoService.loadInfo();
  }
}
