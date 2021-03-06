import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { EnvironmentInfo } from '../../environments/environment-info';
import { ApplicationsService } from '../../settings/applications/services/applications.service';
import { CurrentEnvironmentService } from '../../environments/services/current-environment.service';
import { EnvironmentsService } from '../../environments/services/environments.service';
import { AppConfig } from '../../../app.config';
import { ResourceUploaderModalComponent } from '../../../shared/components/resource-uploader/resource-uploader-modal/resource-uploader-modal.component';
import { EnvironmentCreateComponent } from '../environment-create/environment-create.component';
import { HttpClient } from '@angular/common/http';
import { ComponentCommunicationService } from '../../../shared/services/component-communication.service';
import { Observable, of, Subscription } from 'rxjs';
import { ApplicationBindingService } from '../../settings/applications/application-details/application-binding-service';
import * as LuigiClient from '@kyma-project/luigi-client';

@Component({
  selector: 'app-environment-details',
  templateUrl: './environment-details.component.html',
  styleUrls: ['./environment-details.component.scss']
})
export class EnvironmentDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('uploaderModal')
  private uploaderModal: ResourceUploaderModalComponent;
  @ViewChild('createmodal') private createmodal: EnvironmentCreateComponent;
  private orgName = AppConfig.orgName;
  public environment: EnvironmentInfo = new EnvironmentInfo('', '');
  private boundApplicationsCount: Observable<number> = of(0);
  public applications: any;
  private services: any;
  public errorMessage: string;
  private id: string;
  private isSystemNamespace: boolean;
  private currentEnvironmentSubscription: Subscription;
  private actions = [
    {
      function: 'unbind',
      name: 'Unbind'
    }
  ];
  entryEventHandler = this.getEntryEventHandler();

  constructor(
    private http: HttpClient,
    private applicationsService: ApplicationsService,
    private environmentsService: EnvironmentsService,
    private currentEnvironmentService: CurrentEnvironmentService,
    private communicationService: ComponentCommunicationService,
    private applicationBindingService: ApplicationBindingService
  ) {
    this.subscribeToRefreshComponent();
  }

  public ngOnInit() {
    this.isSystemNamespace = LuigiClient.getEventData().isSystemNamespace;
    this.currentEnvironmentSubscription = this.currentEnvironmentService
      .getCurrentEnvironmentId()
      .subscribe(envId => {
        this.id = envId;
        this.environmentsService.getEnvironment(this.id).subscribe(
          env => {
            if (env) {
              this.environment = env;
            }
            if (!this.isSystemNamespace) {
              this.getApplications(this.id);
            }
            this.getServices(this.id);
          },
          err => {
            this.errorMessage = err.message;
            console.log(`error loading namespace ${envId}`, err);
          }
        );
      });
  }

  public ngOnDestroy() {
    if (this.currentEnvironmentSubscription) {
      this.currentEnvironmentSubscription.unsubscribe();
    }
  }

  private getApplications(id) {
    this.applicationBindingService.getBoundApplications(id).subscribe(
      res => {
        this.applications = res['applications'];
        this.boundApplicationsCount = of(
          this.applications ? this.applications.length : 0
        );
      },
      err => console.log(err)
    );
  }

  private getServices(id) {
    const url = `${AppConfig.k8sApiServerUrl}namespaces/${id}/services`;
    this.http.get<any>(url).subscribe(res => {
      this.services = res.items;
    });
  }

  private openUploadResourceModal() {
    this.uploaderModal.show();
  }

  private subscribeToRefreshComponent() {
    this.communicationService.observable$.subscribe(e => {
      const event: any = e;

      if (event.type === 'createResource' || event.type === 'deleteResource') {
        this.getApplications(this.id);
        this.getServices(this.id);
      }
    });
  }

  getEntryEventHandler() {
    return {
      unbind: (entry: any) => {
        this.applicationBindingService.unbind(this.id, entry.name).subscribe(
          res => {
            this.getApplications(this.id);
          },
          err => console.log(err)
        );
      }
    };
  }

  public navigateToServices() {
    LuigiClient.linkManager()
      .fromContext('namespaces')
      .navigate('services');
  }

  public navigateToApplications(envName) {
    LuigiClient.linkManager().navigate(
      envName ? '/home/cmf-apps/details/' + envName : '/home/cmf-apps'
    );
  }
}
