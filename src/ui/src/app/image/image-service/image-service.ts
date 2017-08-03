import { Injectable } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { Image, ImageDetail } from "../image";
import { AppInitService } from "../../app.init.service";
import "rxjs/operator/toPromise";

@Injectable()
export class ImageService {
  constructor(private http: Http,
              private appInitService: AppInitService) {
  }

  readonly defaultHeaders: Headers = new Headers({
    contentType: "application/json"
  });

  getImages(image_name?: string, image_list_page?: number, image_list_page_size?: number): Promise<Image[]> {
    let options = new RequestOptions({
      headers: this.defaultHeaders,
      params: {
        'token': this.appInitService.token,
        'image_name': image_name,
        'image_list_page': image_list_page.toString(),
        'image_list_page_size': image_list_page_size.toString()
      }
    });
    return this.http.get("/api/v1/images", options).toPromise()
      .then(res => res.json())
      .catch(err => Promise.reject(err));
  }

  getImageDetailList(image_name: string): Promise<ImageDetail[]> {
    let options = new RequestOptions({
      headers: this.defaultHeaders,
      params: {'token': this.appInitService.token}
    });
    return this.http.get(`/api/v1/images/${image_name}`, options)
      .toPromise()
      .then(res => res.json())
      .catch(err => Promise.reject(err));
  }
}