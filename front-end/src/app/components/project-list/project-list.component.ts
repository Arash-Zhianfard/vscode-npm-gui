import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';

import { FilterSearchTypes } from 'src/app/models/filter-search-type';
import { AlertService } from 'src/app/services/alert-service/alert.service';
import { CommandService } from 'src/app/services/command-service/command.service';
import { LoadingScreenService } from 'src/app/services/loading-screen/loading-screen.service';
import { PackageDetail, Project } from '../../../../../src/models/project.model'


@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})

export class ProjectListComponent implements AfterViewInit {
  projects: Project[] = [];
  packageListVersion: Record<string, string> = {};
  displayedColumns: string[] = [
    "PackageName",
    "InstalledVersion",
    "Versions",
    "IsUpdated",
    "NewerVersion",
    "Actions"
  ];
  colSpan: number = 0;

  constructor(
    private loading: LoadingScreenService,
    private commandSrv: CommandService,
    private alertSrv: AlertService,
    private cd: ChangeDetectorRef) {
    this.commandSrv.changeProjects.subscribe(res => {
      if (res === "getData")
        this.getData();
    })
  }

  ngAfterViewInit(): void {
    this.loadPackageVersion(false);
    this.colSpan = this.displayedColumns.length;
  }

  getData() {
    this.loading.startLoading();
    this.commandSrv.getdata().subscribe((res) => {

      this.projects = res.result;
      this.loading.stopLoading();

      this.cd.detectChanges();
    });
  }
  versionIsLoad: boolean = false;
  loadPackageVersion(loadVersion: boolean) {
    this.versionIsLoad = this.versionIsLoad || loadVersion;

    this.loading.startLoading();
    this.commandSrv.reload(loadVersion).subscribe(res => {
      this.projects = res.result;

      this.loading.stopLoading();
      this.cd.detectChanges();
    });
  }

  updateAllProjects() {
    this.loading.startLoading();
    if (this.versionIsLoad == false) {
      this.commandSrv.reload(true).subscribe(() => {
        this.versionIsLoad = true;
        this.commandSrv.updateAllProjects().subscribe(() => {
          this.loading.stopLoading();
          this.getData();
        });
      });
    } else {
      this.commandSrv.updateAllProjects().subscribe(res => {
        this.loading.stopLoading();
        this.getData();
      });
    }

  }

  getVersion(pkg: PackageDetail) {
    const knownVersion = pkg.newerVersion !== "Unknown";
    const updateStatus = pkg.isUpdated && knownVersion ? "Yes" : knownVersion ? "No" : "Unknown";
    return updateStatus
  }

  getVersionStyle(pkg: PackageDetail) {
    const knownVersion = pkg.newerVersion !== "Unknown";
    return pkg.isUpdated && knownVersion ?
      "badge badge-success" : knownVersion ?
        "badge badge-danger" : "badge badge-secondary";
  }

  update(projectId: number, packageName: string) {
    if (this.versionIsLoad) {
      const selectedVersion = this.getSelectedVersion(projectId, packageName);

      this.commandSrv.updatePackage(projectId, packageName, selectedVersion).subscribe(res => {
        this.getData();
      });
    } else {
      this.alertSrv.error("Load the package versions first", "Error")
    }
  }

  updateAll(projectId: number, packageName: string) {
    if (this.versionIsLoad) {
      const selectedVersion = this.getSelectedVersion(projectId, packageName);

      this.commandSrv.updateAllPackage(projectId, packageName, selectedVersion).subscribe(res => {
        this.getData();
      });
    } else {
      this.alertSrv.error("Load the package versions first", "Error")
    }
  }

  remove(projectId: number, packageName: string) {
    const selectedVersion = this.getSelectedVersion(projectId, packageName);

    this.commandSrv.removePackage(projectId, packageName, selectedVersion).subscribe(res => {
      this.getData();
    });
  }

  removeAll(projectId: number, packageName: string) {

    this.commandSrv.removeAllPackage(projectId, packageName).subscribe(res => {
      this.getData();
    });
  }

  change(id: number, packageName: string, value: any) {
    this.packageListVersion[(id + '.' + packageName)] = value;
  }

  getSelectedVersion(projectId: number, packageName: string) {
    return this.packageListVersion[`${projectId}.${packageName}`];
  }

  // ---------------- start search box ------------------------------
  searchValue: string = '';
  filterSearchTypes = FilterSearchTypes;
  filterType = FilterSearchTypes.Contains;
  seatchFilter(packageName: string) {
    let result: boolean = true;
    if (this.searchValue) {
      if (this.filterType == FilterSearchTypes.StartsWith)
        result = packageName.toLocaleLowerCase().startsWith(this.searchValue.toLocaleLowerCase());
      else
        result = packageName.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase());
    }
    return result;
  }

  onSwitchFilterType() {
    if (this.searchValue)
      this.cd.detectChanges();
  }

  // ---------------- end search box ------------------------------

}
