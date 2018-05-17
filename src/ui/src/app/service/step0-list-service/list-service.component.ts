import { Component, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Service } from '../service';
import { ClrDatagridSortOrder, ClrDatagridStateInterface } from '@clr/angular';
import { BUTTON_STYLE, GUIDE_STEP, MESSAGE_TARGET, SERVICE_STATUS } from '../../shared/shared.const';
import { Message } from '../../shared/message-service/message';
import { ServiceDetailComponent } from './service-detail/service-detail.component';
import { ServiceStepBase } from "../service-step";
import { Observable } from "rxjs/Observable";
import { Project } from "../../project/project";
import { ServiceControlComponent } from "./service-control/service-control.component";
import "rxjs/add/observable/interval";

enum CreateServiceMethod{None, Wizards, YamlFile, DevOps}
@Component({
  templateUrl: './list-service.component.html',
  styleUrls: ["./list-service.component.css"]
})
export class ListServiceComponent extends ServiceStepBase implements OnInit, OnDestroy {
  @ViewChild(ServiceDetailComponent) serviceDetailComponent;
  @ViewChild(ServiceControlComponent) serviceControlComponent: ServiceControlComponent;
  currentUser: {[key: string]: any};
  services: Service[];
  isInLoading: boolean = false;
  _subscription: Subscription;
  _subscriptionInterval: Subscription;
  totalRecordCount: number;
  pageIndex: number = 1;
  pageSize: number = 15;
  isBuildServiceWIP: boolean = false;
  isShowServiceCreateYaml: boolean = false;
  createServiceMethod: CreateServiceMethod = CreateServiceMethod.None;
  isActionWIP: Map<number, boolean>;
  projectList: Array<Project>;
  descSort = ClrDatagridSortOrder.DESC;
  oldStateInfo: ClrDatagridStateInterface;

  constructor(protected injector: Injector) {
    super(injector);
    this._subscriptionInterval = Observable.interval(10000).subscribe(() => this.retrieve(true, this.oldStateInfo));
    this.isActionWIP = new Map<number, boolean>();
    this.projectList = Array<Project>();
    this._subscription = this.messageService.messageConfirmed$.subscribe((msg:Message) => {
      if (msg.target == MESSAGE_TARGET.TOGGLE_SERVICE){
        let service: Service = msg.data;
        this.k8sService
          .toggleServiceStatus(service.service_id, service.service_status == 1 ? 0 : 1)
          .then(() => {
            msg.message = 'SERVICE.SUCCESSFUL_TOGGLE';
            this.messageService.inlineAlertMessage(msg);
            this.isActionWIP.set(service.service_id, false);
            this.retrieve(false, this.oldStateInfo);
          })
          .catch(err => {
            this.isActionWIP.set(service.service_id, false);
            this.messageService.dispatchError(err);
          });
      } else if (msg.target == MESSAGE_TARGET.DELETE_SERVICE){
        let service: Service = msg.data;
        this.k8sService
          .deleteService(service.service_id)
          .then(() => {
            msg.message = 'SERVICE.SUCCESSFUL_DELETE';
            this.messageService.inlineAlertMessage(msg);
            this.isActionWIP.set(service.service_id, false);
            this.retrieve(false, this.oldStateInfo);
          })
          .catch(err => {
            this.isActionWIP.set(service.service_id, false);
            this.messageService.dispatchError(err);
          });
      }
    });
  }

  ngOnInit(): void {
    this.currentUser = this.appInitService.currentUser;
    this.k8sService.getProjects()
      .then((res: Array<Project>) => {
        this.projectList = res;
      })
      .catch(err => this.messageService.dispatchError(err));
  }

  ngOnDestroy(): void {
    this._subscriptionInterval.unsubscribe();
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }

  isServiceInStoppedStatus(s: Service): boolean {
    return s.service_status == SERVICE_STATUS.STOPPED && !this.isActionWIP.get(s.service_id);
  }

  isServiceCanChangePauseStatus(service: Service): boolean {
    return service.service_status in [SERVICE_STATUS.RUNNING, SERVICE_STATUS.WARNING]
      && !this.isActionWIP.get(service.service_id);
  }

  isDeleteDisable(service: Service): boolean{
    return service.service_status in [SERVICE_STATUS.PREPARING, SERVICE_STATUS.RUNNING]
      || this.isActionWIP.get(service.service_id)
      || service.service_is_member == 0;
  }

  createService(): void {
    if (this.createServiceMethod == CreateServiceMethod.Wizards) {
      this.k8sService.stepSource.next({index: 1, isBack: false});
    } else if (this.createServiceMethod == CreateServiceMethod.YamlFile) {
      this.isShowServiceCreateYaml = true;
    }
  }

  get isNormalStatus(): boolean {
    return !this.isBuildServiceWIP && !this.isShowServiceCreateYaml;
  }

  retrieve(isAuto: boolean, stateInfo: ClrDatagridStateInterface): void {
    if (this.isNormalStatus && stateInfo) {
      setTimeout(()=>{
        this.isInLoading = !isAuto;
        this.oldStateInfo = stateInfo;
        this.k8sService.getServices(this.pageIndex, this.pageSize, stateInfo.sort.by as string, stateInfo.sort.reverse)
          .then(paginatedServices => {
            this.totalRecordCount = paginatedServices["pagination"]["total_count"];
            this.services = paginatedServices["service_status_list"];
            this.isInLoading = false;
          })
          .catch(err => {
            this.messageService.dispatchError(err);
            this.isInLoading = false;
          });
      });
    }
  }

  getServiceStatus(status: SERVICE_STATUS): string {
    switch (status) {
      case SERVICE_STATUS.PREPARING:
        return 'SERVICE.STATUS_PREPARING';
      case SERVICE_STATUS.RUNNING:
        return 'SERVICE.STATUS_RUNNING';
      case SERVICE_STATUS.STOPPED:
        return 'SERVICE.STATUS_STOPPED';
      case SERVICE_STATUS.WARNING:
        return 'SERVICE.STATUS_UNCOMPLETED';
    }
  }

  getStatusClass(status: SERVICE_STATUS) {
    return {
      'running': status == SERVICE_STATUS.RUNNING,
      'stopped': status == SERVICE_STATUS.STOPPED,
      'warning': status == SERVICE_STATUS.WARNING
    }
  }

  toggleServicePublic(service: Service, $event:MouseEvent): void {
    let toggleMessage = new Message();
    let oldServicePublic = service.service_public;
    this.k8sService
      .toggleServicePublicity(service.service_id, service.service_public == 1 ? 0 : 1)
      .then(() => {
        service.service_public = oldServicePublic == 1 ? 0 : 1;
        toggleMessage.message = 'SERVICE.SUCCESSFUL_TOGGLE';
        this.messageService.inlineAlertMessage(toggleMessage);
      })
      .catch(err => {
        ($event.srcElement as HTMLInputElement).checked = oldServicePublic == 1;
        this.messageService.dispatchError(err);
      });
  }

  toggleService(service: Service){
    if (service.service_is_member == 1){
      let announceMessage = new Message();
      announceMessage.title = "SERVICE.TOGGLE_SERVICE";
      announceMessage.message = "SERVICE.CONFIRM_TO_TOGGLE_SERVICE";
      announceMessage.params = [service.service_name];
      announceMessage.target = MESSAGE_TARGET.TOGGLE_SERVICE;
      announceMessage.buttons = BUTTON_STYLE.CONFIRMATION;
      announceMessage.data = service;
      this.messageService.announceMessage(announceMessage);
    }
  }

  deleteService(service:Service){
    if (!this.isDeleteDisable(service)){
      let announceMessage = new Message();
      announceMessage.title = "SERVICE.DELETE_SERVICE";
      announceMessage.message = "SERVICE.CONFIRM_TO_DELETE_SERVICE";
      announceMessage.params = [service.service_name];
      announceMessage.target = MESSAGE_TARGET.DELETE_SERVICE;
      announceMessage.buttons = BUTTON_STYLE.DELETION;
      announceMessage.data = service;
      this.messageService.announceMessage(announceMessage);
    }
  }

  openServiceDetail(s: Service) {
    this.serviceDetailComponent.openModal(s);
  }

  openServiceControl(service: Service) {
    if (service.service_is_member == 1 && service.service_status == SERVICE_STATUS.RUNNING){
      this.serviceControlComponent.service = service;
      this.serviceControlComponent.openModal();
    }
  }

  get isFirstLogin(): boolean {
    return this.appInitService.isFirstLogin;
  }

  get guideStep(): GUIDE_STEP {
    return this.appInitService.guideStep;
  }

  guideNextStep(step: GUIDE_STEP) {
    this.isBuildServiceWIP = true;
    this.setGuideNoneStep();
  }

  setGuideNoneStep() {
    this.appInitService.guideStep = GUIDE_STEP.NONE_STEP;
  }

  setCreateServiceMethod(method: CreateServiceMethod): void {
    this.createServiceMethod = method;
  }

  cancelCreateService() {
    this.createServiceMethod = CreateServiceMethod.None;
    this.isBuildServiceWIP = false;
    this.isShowServiceCreateYaml = false;
  }
}
