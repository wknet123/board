import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from "@angular/http"
import "rxjs/add/operator/map";
import 'rxjs/add/operator/toPromise';

export interface LineDataModel {
	readonly date: Date;
	readonly value: number;
}

export interface ServiceListModel {
	readonly service_name: string;
}

export interface ServiceDataModel {
	readonly time_stamp: number;
	readonly pods_number: number;
	readonly container_number: number;
}

export interface NodeDataModel {
	readonly date: Date;
	readonly value: number;
}

export interface StorageDataModel {
	readonly date: Date;
	readonly value: number;
}

const BASE_URL = "/api/v1";
@Injectable()
export class DashboardService {

	static baseDate: Date = new Date();

	getOneStepTime(dateScaleId: number): number {
		switch (dateScaleId) {
			case 1:
				return 5 * 1000;
			case 2:
				return 60 * 1000;
			case 3:
				return 24 * 60 * 1000;
			case 4:
				return 12 * 24 * 60 * 1000;

			default:
				return 1;
		}
	}

	private getSimulateData(serviceID: number): number {
		switch (serviceID) {
			case 0:
				return 130 + Math.round(Math.random() * 50);
			case 1:
				return 30 + Math.round(Math.random() * 10);
			case 2:
				return 20 + Math.round(Math.random() * 10);
			case 3:
				return 50 + Math.round(Math.random() * 10);
			case 4:
				return 30 + Math.round(Math.random() * 20);
		}
	}

	private getSimulateDate(dateScaleId: number): Date {
		DashboardService.baseDate.setTime(DashboardService.baseDate.getTime()
			+ this.getOneStepTime(dateScaleId));
		return new Date(DashboardService.baseDate.getTime());
	}

	/**
     * getServiceData
     * @param serviceID
     * @param dateScaleId
     *node:dateScaleId=>1:1min;2:1hr;3:1day;4:1mth
     */
	getBySimulateData(serviceID: number, dateScaleId: number): Map<number, LineDataModel[]> {
		if (!dateScaleId || dateScaleId < 1 || dateScaleId > 4) return null;
		let r: Map<number, LineDataModel[]> = new Map<number, LineDataModel[]>();
		r[0] = new Array<LineDataModel>(0);
		r[1] = new Array<LineDataModel>(0);
		for (let i = 0; i < 11; i++) {
			let date: Date = this.getSimulateDate(dateScaleId)
			let arrBuf1 = [date, this.getSimulateData(serviceID)];
			let arrBuf2 = [date, this.getSimulateData(serviceID)];
			r[0].push(arrBuf1);
			r[1].push(arrBuf2);
		}
		return r;
	}
	constructor(private http: Http) { };

	readonly defaultHeaders: Headers = new Headers({
		contentType: "application/json"
	});

	getServiceList(): Promise<ServiceListModel[]> {
		let options = new RequestOptions({ headers: this.defaultHeaders });
		return this.http.get(BASE_URL.concat("/service/list"), options)
			.toPromise()
			.then(res => {
				let arr = Array.from(res.json()).sort((a, b) => {
					return a["service_name"] == b["service_name"] ? 0 :
						a["service_name"] > b["service_name"] ? 1 : -1;
				});
				//add total service
				arr.unshift({service_name:"total"});
				return Promise.resolve(arr as ServiceListModel[]);
			})
			.catch(this.handleError);
	};

	/**data origin
	 *{"service_name": "mysql-read",
			"service_timeunit": "second",
			"service_count": "11",
			"service_statuslogs": [{
						"pods_number": 2,
						"container_number": 4,
						"time_stamp":1499842237
			}]
		}
*/
	getServiceData(service_time_count: number, service_time_unit: string, service_name: string):
		Promise<Map<string, LineDataModel[]>> {
		let params: Map<string, string> = new Map<string, string>();
		params["service_time_count"] = service_time_count.toString();
		params["service_timeunit"] = service_time_unit;
		params["service_name"] = service_name;
		let options = new RequestOptions({
			headers: this.defaultHeaders,
			search: params
		});
		return this.http.get(BASE_URL.concat("/dashboard/service"), options)
			.toPromise()
			.then(res => {
				let resJson: object = res.json();
				let logs: ServiceDataModel[] = resJson["service_statuslogs"];
				let r: Map<string, LineDataModel[]> = new Map<string, LineDataModel[]>();
				r["pods"] = new Array<LineDataModel>(0);
				r["container"] = new Array<LineDataModel>(0);
				if (logs && logs.length > 0) {
					logs.forEach((item: ServiceDataModel) => {
						r["pods"].unshift([new Date(item.time_stamp * 1000), item.pods_number]);
						r["container"].unshift([new Date(item.time_stamp * 1000), item.container_number]);
					});
				}
				return Promise.resolve(r);
			}).catch(this.handleError);
	}

	private handleError(error: Response | any) {
		let errMsg: string;
		if (error instanceof Response) {
			const body = error.json() || '';
			const err = body["error"] || JSON.stringify(body);
			errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
		} else {
			errMsg = error.message ? error.message : error.toString();
		}
		return Promise.reject(errMsg);
	}

}
