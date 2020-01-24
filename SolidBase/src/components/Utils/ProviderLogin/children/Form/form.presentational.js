import React from 'react';
import styled from 'styled-components';
import { ProviderSelect } from '../../../ProviderSelect';
import { SolidButton, ErrorMessage } from '@styled-components';

const LoginFormWrapper = styled.div`
  button {
    margin: 20px auto;
    display: block;
  }
`;

const LoginForm = props => {
  const {
    className,
    onSubmit,
    error,
    selectPlaceholder,
    onSelectChange,
    providers,

    formButtonText,
    theme
  } = props;
  return (
    <LoginFormWrapper className={`solid-provider-login-component ${className} ${error && 'error'}`}>
      <form onSubmit={onSubmit}>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
          <ProviderSelect
            {...{
              placeholder: selectPlaceholder,
              onChange: onSelectChange,
              options: providers,
              components: true,
              name: 'provider'
            }}
          />
        <SolidButton type="submit" data-testid="provider-form-button" className={theme.buttonLogin}>
          {formButtonText}
        </SolidButton>
      </form>
    </LoginFormWrapper>
  );
};

export default LoginForm;
