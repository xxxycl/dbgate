<script lang="ts">
  import FormElectronFileSelector from '../forms/FormElectronFileSelector.svelte';

  import { getFormContext } from '../forms/FormProviderCore.svelte';

  import FormCheckboxField from '../forms/FormCheckboxField.svelte';
  import getElectron from '../utility/getElectron';
  import FormPasswordField from '../forms/FormPasswordField.svelte';
  import { openedConnections, openedSingleDatabaseConnections } from '../stores';
  import { _t } from '../translations';

  const { values, setFieldValue } = getFormContext();
  const electron = getElectron();

  $: useSsl = $values.useSsl;
  $: isConnected = $openedConnections.includes($values._id) || $openedSingleDatabaseConnections.includes($values._id);
</script>

<FormCheckboxField label={_t('connectionSslFields.useSsl', { defaultMessage: 'Use SSL' })} name="useSsl" disabled={isConnected} />
<FormElectronFileSelector label={_t('connectionSslFields.caCertOptional', { defaultMessage: 'CA Cert (optional)' })} name="sslCaFile" disabled={isConnected || !useSsl || !electron} />
<FormElectronFileSelector
  label={_t('connectionSslFields.certificateOptional', { defaultMessage: 'Certificate (optional)' })}
  name="sslCertFile"
  disabled={isConnected || !useSsl || !electron}
/>
<FormPasswordField
  label={_t('connectionSslFields.certificateKeyFilePasswordOptional', { defaultMessage: 'Certificate key file password (optional)' })}
  name="sslCertFilePassword"
  disabled={isConnected || !useSsl || !electron}
/>
<FormElectronFileSelector
  label={_t('connectionSslFields.keyFileOptional', { defaultMessage: 'Key file (optional)' })}
  name="sslKeyFile"
  disabled={isConnected || !useSsl || !electron}
/>
<FormCheckboxField label={_t('connectionSslFields.rejectUnauthorized', { defaultMessage: 'Reject unauthorized' })} name="sslRejectUnauthorized" disabled={isConnected || !useSsl} />
