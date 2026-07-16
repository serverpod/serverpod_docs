---
sidebar_label: UI Components
description: Authentication UI components and controllers let you build sign-in, registration, and password flows, including the all-in-one SignInWidget.
---

# Authentication UI components

The authentication system provides a comprehensive set of UI components and controllers for building authentication interfaces. These components handle the complete authentication flow, including sign-in, registration, and password management.

## Overview

The UI component architecture consists of:

- **Common widgets**: Reusable widgets for building custom authentication interfaces.
- **Provider-specific widgets**: Pre-built UI components that are used in specific providers.
- **Controllers**: Business logic classes that can be used with custom UI.

## SignInWidget

The `SignInWidget` is an all-in-one widget that automatically detects available authentication providers and displays the appropriate sign-in options.

```dart
import 'package:flutter/material.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

class SignInPage extends StatelessWidget {
  final Client client;

  const SignInPage({required this.client, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SignInWidget(
        client: client,
        onAuthenticated: () {
          // Do something when the user is authenticated.
          //
          // NOTE: You should not navigate to the home screen here, otherwise
          // the user will have to sign in again every time they open the app.
        },
        onError: (error) {
          // Handle errors
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $error')),
          );
        },
      ),
    );
  }
}
```

### Localize sign-in text

Wrap `SignInWidget`, or individual authentication widgets, in a `SignInLocalizationProvider` to replace their built-in English text. The following example supplies Brazilian Portuguese text for the common UI, the complete email flow, password requirements, and each supported provider button:

```dart
const basicTexts = BasicSignInTexts(
  noAuthenticationProvidersConfigured:
      'Nenhum provedor de autenticação configurado',
  orContinueWith: 'ou continue com',
);

const emailTexts = EmailSignInTexts(
  title: 'Entrar com e-mail',
  forgotPassword: 'Esqueceu sua senha?',
  signIn: 'Entrar',
  dontHaveAnAccount: 'Não tem uma conta?',
  signUp: 'Criar conta',
  signUpTitle: 'Criar conta com e-mail',
  continueAction: 'Continuar',
  alreadyHaveAnAccount: 'Já tem uma conta?',
  verifyAccountTitle: 'Verificar conta',
  verifyResetCodeTitle: 'Verificar código de redefinição',
  verificationMessage:
      'Enviamos um e-mail de verificação. Confira sua caixa de entrada e '
      'digite o código abaixo.',
  verify: 'Verificar',
  setAccountPasswordTitle: 'Definir senha da conta',
  passwordLabel: 'Senha',
  backToSignUp: 'Voltar para criar conta',
  setNewPasswordTitle: 'Definir nova senha',
  newPasswordLabel: 'Nova senha',
  resetPasswordTitle: 'Redefinir senha',
  resetPasswordDescription:
      'Digite o endereço de e-mail para redefinir sua senha.',
  requestPasswordReset: 'Solicitar redefinição de senha',
  resetPassword: 'Redefinir senha',
  backToSignIn: 'Voltar para entrar',
  emailLabel: 'E-mail',
  termsIntro: 'Li e aceito os ',
  termsAndConditions: 'Termos e Condições',
  andText: ' e a ',
  privacyPolicy: 'Política de Privacidade',
);

const passwordTexts = PasswordRequirementTexts(
  minLengthTemplate: 'Pelo menos {length} caracteres',
  maxLengthTemplate: 'No máximo {length} caracteres',
  containsLowercase: 'Contém pelo menos uma letra minúscula',
  containsUppercase: 'Contém pelo menos uma letra maiúscula',
  containsNumber: 'Contém pelo menos um número',
  containsSpecialCharacter: 'Contém pelo menos um caractere especial',
);

SignInLocalizationProvider(
  basic: basicTexts,
  email: emailTexts,
  passwordRequirementTexts: passwordTexts,
  apple: const AppleSignInTexts(signInButton: 'Entrar com Apple'),
  google: const GoogleSignInTexts(signInButton: 'Entrar com Google'),
  github: const GitHubSignInTexts(signInButton: 'Entrar com GitHub'),
  microsoft: const MicrosoftSignInTexts(signInButton: 'Entrar com Microsoft'),
  facebook: const FacebookSignInTexts(signInButton: 'Entrar com Facebook'),
  anonymous: const AnonymousSignInTexts(signInButton: 'Entrar como visitante'),
  child: SignInWidget(
    client: client,
    onAuthenticated: onAuthenticated,
    onError: onError,
  ),
);
```

`BasicSignInTexts` covers shared messages and dividers. `EmailSignInTexts` covers email sign-in, registration, account verification, password reset, and terms and privacy labels. The provider-specific objects cover the Apple, Google, GitHub, Microsoft, Facebook, and anonymous sign-in buttons. `PasswordRequirementTexts` controls the labels shown by built-in password requirement widgets. Keep the `{length}` placeholder in the minimum and maximum length templates.

Every text object has a `defaults` constant with the built-in English text. If you omit an object from `SignInLocalizationProvider`, its default is used. To change only some values, start from the defaults:

```dart
email: EmailSignInTexts.defaults.copyWith(
  title: 'Entrar com e-mail',
  signIn: 'Entrar',
),
```

`SignInLocalizationProvider` supplies text to its descendant widgets. It does not select translations from Flutter's current `Locale`. If your app supports several locales, choose the matching text objects through your app's localization setup and rebuild the provider when the locale changes.

Firebase authentication is not covered by these text objects. The `serverpod_auth_idp_flutter_firebase` package supplies a controller for the Firebase flow, so localize the Flutter UI that you connect to that controller.

### Disable providers

It is not possible to forcefully enable a provider, since this depends on the configuration of the identity providers, as described in the [setup section](./setup#identity-providers-configuration).

But, even though the `SignInWidget` automatically detects enabled providers, you can disable specific providers if you want to hide them on the client, but still keep them available on the server.

This is useful if you want to gradually disable a provider, but still keep compatibility with older clients.

```dart
SignInWidget(
  client: client,
  disableEmailSignInWidget: false,
  disableGoogleSignInWidget: false,
  disableAppleSignInWidget: true, // Disable Apple sign-in
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
)
```

### Customize SignInWidget

You can customize individual provider widgets:

```dart
final signInWidget = SignInWidget(
  client: client,
  emailSignInWidget: EmailSignInWidget(
    client: client,
    startScreen: EmailFlowScreen.login,
    // NOTE: When you opt-out of the internal widget, you need to provide your
    // own `onAuthenticated` and `onError` callbacks.
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  googleSignInWidget: GoogleSignInWidget(
    client: client,
    theme: GSIButtonTheme.filledBlack,
    scopes: const [
      ...GoogleAuthController.defaultScopes,
      'https://www.googleapis.com/auth/youtube',
    ],
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  appleSignInWidget: AppleSignInWidget(
    client: client,
    style: AppleButtonStyle.black,
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  onAuthenticated: _onAuthenticated,
  onError: _onError,
);

void _onAuthenticated() {
  // Handle successful authentication
}

void _onError(Object error) {
  // Handle errors
}
```

For more details on all options of each provider widget, see the "Customizing UI" section of the specific provider documentation. There you will also find information on how to build a custom UI with the controller. For example, see the [Email Provider](./providers/email/customizing-the-ui) documentation.
