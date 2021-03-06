import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from '../../shared.service/message.service';
import { AccountTypes, SignUp } from '../account.types';
import { AccountService } from '../account.service';
import { AppInitService } from '../../shared.service/app-init.service';
import { CsComponentBase } from '../../shared/cs-components-library/cs-component-base';
import { RouteSignIn } from '../../shared/shared.const';

@Component({
   templateUrl: './sign-up.component.html',
   styleUrls: [ './sign-up.component.css' ]
})
export class SignUpComponent extends CsComponentBase implements OnInit {
  isSignUpWIP = false;
  signUpModel: SignUp = new SignUp();

  constructor(private accountService: AccountService,
              private messageService: MessageService,
              private appInitService: AppInitService,
              private router: Router) {
    super();
  }

  ngOnInit(): void {
    if (this.appInitService.systemInfo.authMode !== 'db_auth') {
      this.router.navigate(['/account/sign-in']).then();
    }
  }

  signUp(): void {
    if (this.verifyInputExValid()) {
      this.isSignUpWIP = true;
      const account: AccountTypes = {
        username: this.signUpModel.username,
        email: this.signUpModel.email,
        password: this.signUpModel.password,
        realname: this.signUpModel.realname,
        comment: this.signUpModel.comment
      };
      this.accountService.signUp(account).subscribe(
        () => this.messageService.showAlert('ACCOUNT.SUCCESS_TO_SIGN_UP'),
        (err: HttpErrorResponse) => {
          this.isSignUpWIP = false;
          if (err && err.status === 409) {
            this.messageService.showOnlyOkDialog('ACCOUNT.USERNAME_ALREADY_EXISTS', 'ACCOUNT.ERROR');
          } else {
            this.messageService.showOnlyOkDialog('ACCOUNT.FAILED_TO_SIGN_UP', 'ACCOUNT.ERROR');
          }
        },
        () => this.router.navigate([RouteSignIn]).then());
    }
  }

  goBack(): void {
    this.router.navigate([RouteSignIn]).then();
  }
}
