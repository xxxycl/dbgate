<script lang="ts">
  import FormElectronFileSelector from '../forms/FormElectronFileSelector.svelte';

  import FormPasswordField from '../forms/FormPasswordField.svelte';

  import { getFormContext } from '../forms/FormProviderCore.svelte';
  import FormSelectField from '../forms/FormSelectField.svelte';

  import FormTextField from '../forms/FormTextField.svelte';
  import FormCheckboxField from '../forms/FormCheckboxField.svelte';
  import getElectron from '../utility/getElectron';
  import { usePlatformInfo } from '../utility/metadataLoaders';
  import FontIcon from '../icons/FontIcon.svelte';
  import { extensions, openedConnections, openedSingleDatabaseConnections } from '../stores';
  import { _t } from '../translations';

  const { values, setFieldValue } = getFormContext();
  const electron = getElectron();

  $: useSshTunnel = $values.useSshTunnel;
  $: platformInfo = usePlatformInfo();

  // $: {
  //   if (!$values.sshMode) setFieldValue('sshMode', 'userPassword');
  //   // if (!$values.sshPort) setFieldValue('sshPort', '22');
  //   if (!$values.sshKeyfile && $platformInfo) setFieldValue('sshKeyfile', $platformInfo.defaultKeyfile);
  // }

  $: isConnected = $openedConnections.includes($values._id) || $openedSingleDatabaseConnections.includes($values._id);
</script>

<FormCheckboxField
  label={_t('connectionSshTunnelFields.useSshTunnel', { defaultMessage: 'Use SSH tunnel' })}
  name="useSshTunnel"
  disabled={isConnected}
  data-testid="ConnectionSshTunnelFields_useSshTunnel"
/>

<div class="row">
  <div class="col-9 mr-1">
    <FormTextField
      label={_t('connectionSshTunnelFields.host', { defaultMessage: 'Host' })}
      name="sshHost"
      disabled={isConnected || !useSshTunnel}
      templateProps={{ noMargin: true }}
      data-testid="ConnectionSshTunnelFields_sshHost"
    />
  </div>
  <div class="col-3">
    <FormTextField
      label={_t('connectionSshTunnelFields.port', { defaultMessage: 'Port' })}
      name="sshPort"
      disabled={isConnected || !useSshTunnel}
      templateProps={{ noMargin: true }}
      placeholder="22"
      data-testid="ConnectionSshTunnelFields_sshPort"
    />
  </div>
</div>
<FormTextField label={_t('connectionSshTunnelFields.bastionHost', { defaultMessage: 'Bastion host (Jump host)' })} name="sshBastionHost" disabled={isConnected || !useSshTunnel} />

<FormSelectField
  label={_t('connectionSshTunnelFields.sshAuthentication', { defaultMessage: 'SSH Authentication' })}
  name="sshMode"
  isNative
  defaultSelectValue="userPassword"
  disabled={isConnected || !useSshTunnel}
  options={[
    { value: 'userPassword', label: _t('connectionSshTunnelFields.usernamePassword', { defaultMessage: 'Username & password' }) },
    { value: 'agent', label: _t('connectionSshTunnelFields.sshAgent', { defaultMessage: 'SSH agent' }) },
    { value: 'keyFile', label: _t('connectionSshTunnelFields.keyFile', { defaultMessage: 'Key file' }) },
  ]}
  data-testid="ConnectionSshTunnelFields_sshMode"
/>

{#if ($values.sshMode || 'userPassword') != 'userPassword'}
  <FormTextField
    label={_t('connectionSshTunnelFields.login', { defaultMessage: 'Login' })}
    name="sshLogin"
    disabled={isConnected || !useSshTunnel}
    data-testid="ConnectionSshTunnelFields_sshLogin"
  />
{/if}

{#if ($values.sshMode || 'userPassword') == 'userPassword'}
  <div class="row">
    <div class="col-6 mr-1">
      <FormTextField
        label={_t('connectionSshTunnelFields.login', { defaultMessage: 'Login' })}
        name="sshLogin"
        disabled={isConnected || !useSshTunnel}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionSshTunnelFields_sshLogin"
      />
    </div>
    <div class="col-6">
      <FormPasswordField
        label={_t('connectionSshTunnelFields.password', { defaultMessage: 'Password' })}
        name="sshPassword"
        disabled={isConnected || !useSshTunnel}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionSshTunnelFields_sshPassword"
      />
    </div>
  </div>
{/if}

{#if $values.sshMode == 'keyFile'}
  <div class="row">
    <div class="col-6 mr-1">
      {#if electron}
        <FormElectronFileSelector
          label={_t('connectionSshTunnelFields.privateKeyFile', { defaultMessage: 'Private key file' })}
          name="sshKeyfile"
          disabled={isConnected || !useSshTunnel}
          templateProps={{ noMargin: true }}
          defaultFileName={$platformInfo?.defaultKeyfile}
          data-testid="ConnectionSshTunnelFields_sshKeyfile"
        />
      {:else}
        <FormTextField
          label={_t('connectionSshTunnelFields.privateKeyFilePathOnServer', { defaultMessage: 'Private key file (path on server)' })}
          name="sshKeyfile"
          disabled={isConnected || !useSshTunnel}
          templateProps={{ noMargin: true }}
          placeholder={$platformInfo?.defaultKeyfile}
          data-testid="ConnectionSshTunnelFields_sshKeyfile"
        />
      {/if}
    </div>
    <div class="col-6">
      <FormPasswordField
        label={_t('connectionSshTunnelFields.keyFilePassphrase', { defaultMessage: 'Key file passphrase' })}
        name="sshKeyfilePassword"
        disabled={isConnected || !useSshTunnel}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionSshTunnelFields_sshKeyfilePassword"
      />
    </div>
  </div>
{/if}

{#if useSshTunnel && $values.sshMode == 'agent'}
  <div class="ml-3 mb-3">
    {#if $platformInfo && $platformInfo.sshAuthSock}
      <FontIcon icon="img ok" /> {_t('connectionSshTunnelFields.sshAgentFound', { defaultMessage: 'SSH Agent found' })}
    {:else}
      <FontIcon icon="img error" /> {_t('connectionSshTunnelFields.sshAgentNotFound', { defaultMessage: 'SSH Agent not found' })}
    {/if}
  </div>
{/if}

<style>
  .row {
    margin: var(--dim-large-form-margin);
    display: flex;
  }
</style>
