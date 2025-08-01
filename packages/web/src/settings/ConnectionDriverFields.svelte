<script lang="ts">
  import FormCheckboxField from '../forms/FormCheckboxField.svelte';
  import FormElectronFileSelector from '../forms/FormElectronFileSelector.svelte';

  import FormPasswordField from '../forms/FormPasswordField.svelte';
  import _ from 'lodash';

  import { getFormContext } from '../forms/FormProviderCore.svelte';
  import FormRadioGroupField from '../forms/FormRadioGroupField.svelte';
  import FormSelectField from '../forms/FormSelectField.svelte';

  import FormTextField from '../forms/FormTextField.svelte';
  import { extensions, getCurrentConfig, openedConnections, openedSingleDatabaseConnections } from '../stores';
  import getElectron from '../utility/getElectron';
  import { useAuthTypes, useConfig } from '../utility/metadataLoaders';
  import FormColorField from '../forms/FormColorField.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import FormDropDownTextField from '../forms/FormDropDownTextField.svelte';
  import { getConnectionLabel } from 'dbgate-tools';
  import { _t } from '../translations';
  import FormFileInputField from '../forms/FormFileInputField.svelte';

  export let getDatabaseList;
  export let currentConnection;

  const { values, setFieldValue } = getFormContext();
  const electron = getElectron();

  $: authType = $values.authType;
  $: engine = $values.engine;
  $: useDatabaseUrl = $values.useDatabaseUrl;
  $: authTypes = useAuthTypes({ engine });
  $: currentAuthType = $authTypes && $authTypes.find(x => x.name == authType);
  $: disabledFields = (currentAuthType ? currentAuthType.disabledFields : null) || [];
  $: driver = $extensions.drivers.find(x => x.engine == engine);
  $: defaultDatabase = $values.defaultDatabase;
  $: config = useConfig();

  $: showConnectionFieldArgs = { config: $config };

  $: showUser =
    driver?.showConnectionField('user', $values, showConnectionFieldArgs) && $values.passwordMode != 'askUser';
  $: showPassword =
    driver?.showConnectionField('password', $values, showConnectionFieldArgs) &&
    $values.passwordMode != 'askPassword' &&
    $values.passwordMode != 'askUser';
  $: showPasswordMode = driver?.showConnectionField('password', $values, showConnectionFieldArgs);
  $: isConnected = $openedConnections.includes($values._id) || $openedSingleDatabaseConnections.includes($values._id);

  const awsRegions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'af-south-1',
    'ap-east-1',
    'ap-south-1',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-northeast-3',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-southeast-3',
    'ca-central-1',
    'cn-north-1',
    'cn-northwest-1',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'eu-south-1',
    'eu-south-2',
    'me-south-1',
    'me-central-1',
    'sa-east-1',
  ];

  async function createDatabasesMenu() {
    const databases = await getDatabaseList();
    return databases.map(db => ({
      text: db.name,
      onClick: () => setFieldValue('defaultDatabase', db.name),
    }));
  }


</script>

<FormSelectField
  label={_t('connectionDriverFields.connectionType', { defaultMessage: 'Connection type' })}
  name="engine"
  isNative
  disabled={isConnected}
  data-testid="ConnectionDriverFields_connectionType"
  options={[
    { label: _t('connectionDriverFields.selectConnectionType', { defaultMessage: '(select connection type)' }), value: '' },
    ..._.sortBy(
      $extensions.drivers
        // .filter(driver => !driver.isElectronOnly || electron)
        .map(driver => ({
          value: driver.engine,
          label: driver.title,
        })),
      'label'
    ),
  ]}
/>

{#if $authTypes && driver?.showConnectionField('authType', $values, showConnectionFieldArgs) && driver?.authTypeFirst}
  {#key $authTypes}
    <FormSelectField
      label={driver?.authTypeLabel ?? 'Authentication'}
      data-testid="ConnectionDriverFields_authType"
      name="authType"
      isNative
      disabled={isConnected}
      defaultValue={driver?.defaultAuthTypeName}
      options={$authTypes.map(auth => ({
        value: auth.name,
        label: auth.title,
      }))}
    />
  {/key}
{/if}

{#if driver?.showConnectionField('databaseFile', $values, showConnectionFieldArgs)}
  {#if electron && !driver?.dialect?.useServerDatabaseFile}
    <FormElectronFileSelector
      label={_t('connectionDriverFields.databaseFile', { defaultMessage: 'Database file' })}
      name="databaseFile"
      disabled={isConnected || disabledFields.includes('databaseFile')}
    />
  {:else}
    <FormTextField
      label={_t('connectionDriverFields.databaseFilePathOnServer', { defaultMessage: 'Database file (path on server)' })}
      name="databaseFile"
      disabled={isConnected || disabledFields.includes('databaseFile')}
    />
  {/if}
{/if}

{#if driver?.showConnectionField('useDatabaseUrl', $values, showConnectionFieldArgs)}
  <div class="radio">
    <FormRadioGroupField
      disabled={isConnected || disabledFields.includes('useDatabaseUrl')}
      name="useDatabaseUrl"
      matchValueToOption={(value, option) => !!option.value == !!value}
      options={[
        { label: _t('connectionDriverFields.fillConnectionDetails', { defaultMessage: 'Fill database connection details' }), value: '', default: true },
        { label: _t('connectionDriverFields.useDatabaseUrl', { defaultMessage: 'Use database URL' }), value: '1' },
      ]}
    />
  </div>
{/if}

{#if driver?.showConnectionField('databaseUrl', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.databaseUrl', { defaultMessage: 'Database URL' })}
    name="databaseUrl"
    data-testid="ConnectionDriverFields_databaseUrl"
    placeholder={driver?.databaseUrlPlaceholder}
    disabled={isConnected || disabledFields.includes('databaseUrl')}
  />
{/if}

{#if driver?.showConnectionField('localDataCenter', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.localDataCenter', { defaultMessage: 'Local DataCenter' })}
    name="localDataCenter"
    data-testid="ConnectionDriverFields_localDataCenter"
    placeholder={driver?.defaultLocalDataCenter}
    disabled={isConnected || disabledFields.includes('localDataCenter')}
  />
{/if}

{#if driver?.showConnectionField('authToken', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('authToken', { defaultMessage: 'Auth token' })}
    name="authToken"
    data-testid="ConnectionDriverFields_authToken"
    disabled={isConnected || disabledFields.includes('authToken')}
  />
{/if}

{#if $authTypes && driver?.showConnectionField('authType', $values, showConnectionFieldArgs) && !driver?.authTypeFirst}
  {#key $authTypes}
    <FormSelectField
      label={driver?.authTypeLabel ?? _t('connectionDriverFields.authentication', { defaultMessage: 'Authentication' })}
      data-testid="ConnectionDriverFields_authType"
      name="authType"
      isNative
      disabled={isConnected}
      defaultValue={driver?.defaultAuthTypeName}
      options={$authTypes.map(auth => ({
        value: auth.name,
        label: auth.title,
      }))}
    />
  {/key}
{/if}

{#if driver?.showConnectionField('endpoint', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.endpoint', { defaultMessage: 'Endpoint' })}
    name="endpoint"
    disabled={isConnected || disabledFields.includes('endpoint')}
    data-testid="ConnectionDriverFields_endpoint"
  />
{/if}

{#if driver?.showConnectionField('endpointKey', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.key', { defaultMessage: 'Key' })}
    name="endpointKey"
    disabled={isConnected || disabledFields.includes('endpointKey')}
    data-testid="ConnectionDriverFields_endpointKey"
  />
{/if}

{#if driver?.showConnectionField('clientLibraryPath', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.clientLibraryPath', { defaultMessage: 'Client library path' })}
    name="clientLibraryPath"
    disabled={isConnected || disabledFields.includes('clientLibraryPath')}
    data-testid="ConnectionDriverFields_clientLibraryPath"
  />
{/if}

{#if driver?.showConnectionField('server', $values, showConnectionFieldArgs)}
  <div class="row">
    <div class="col-9 mr-1">
      <FormTextField
        label={_t('connectionDriverFields.server', { defaultMessage: 'Server' })}
        name="server"
        disabled={isConnected || disabledFields.includes('server')}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionDriverFields_server"
      />
    </div>
    {#if driver?.showConnectionField('port', $values, showConnectionFieldArgs)}
      <div class="col-3 mr-1">
        <FormTextField
          label={_t('connectionDriverFields.port', { defaultMessage: 'Port' })}
          name="port"
          disabled={isConnected || disabledFields.includes('port')}
          templateProps={{ noMargin: true }}
          placeholder={driver?.defaultPort}
          data-testid="ConnectionDriverFields_port"
        />
      </div>
    {/if}
  </div>
  {#if getCurrentConfig().isDocker}
    <div class="row">
      <FontIcon icon="img warn" padRight />
      {_t('connectionDriverFields.dockerWarning', { defaultMessage: 'Under docker, localhost and 127.0.0.1 will not work, use dockerhost instead' })}
    </div>
  {/if}
{/if}

{#if driver?.showConnectionField('serviceName', $values, showConnectionFieldArgs)}
  <div class="row">
    <div class="col-9 mr-1">
      <FormTextField
        label={$values.serviceNameType == 'sid' ? 'SID' : _t('connectionDriverFields.serviceName', { defaultMessage: 'Service name' })}
        name="serviceName"
        disabled={isConnected}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionDriverFields_serviceName"
      />
    </div>
    <div class="col-3">
      <FormSelectField
        label={_t('connectionDriverFields.chooseType', { defaultMessage: 'Choose type' })}
        isNative
        name="serviceNameType"
        defaultValue="serviceName"
        disabled={isConnected}
        templateProps={{ noMargin: true }}
        options={[
          { value: 'serviceName', label: _t('connectionDriverFields.serviceName', { defaultMessage: 'Service name' }) },
          { value: 'sid', label: 'SID' },
        ]}
        data-testid="ConnectionDriverFields_serviceNameType"
      />
    </div>
  </div>
{/if}

{#if driver?.showConnectionField('socketPath', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.socketPath', { defaultMessage: 'Socket path' })}
    name="socketPath"
    disabled={isConnected || disabledFields.includes('socketPath')}
    placeholder={driver?.defaultSocketPath}
    data-testid="ConnectionDriverFields_scoketPath"
  />
{/if}

{#if showUser && showPassword}
  <div class="row">
    {#if showUser}
      <div class="col-6 mr-1">
        <FormTextField
          label={_t('connectionDriverFields.user', { defaultMessage: 'User' })}
          name="user"
          disabled={isConnected || disabledFields.includes('user')}
          templateProps={{ noMargin: true }}
          data-testid="ConnectionDriverFields_user"
        />
      </div>
    {/if}
    {#if showPassword}
      <div class="col-6 mr-1">
        <FormPasswordField
          label={_t('connectionDriverFields.password', { defaultMessage: 'Password' })}
          name="password"
          disabled={isConnected || disabledFields.includes('password')}
          templateProps={{ noMargin: true }}
          data-testid="ConnectionDriverFields_password"
        />
      </div>
    {/if}
  </div>
{/if}
{#if showUser && !showPassword}
  <FormTextField
    label={_t('connectionDriverFields.user', { defaultMessage: 'User' })}
    name="user"
    disabled={isConnected || disabledFields.includes('user')}
    data-testid="ConnectionDriverFields_user"
  />
{/if}
{#if !showUser && showPassword}
  <FormPasswordField
    label={_t('connectionDriverFields.password', { defaultMessage: 'Password' })}
    name="password"
    disabled={isConnected || disabledFields.includes('password')}
    data-testid="ConnectionDriverFields_password"
  />
{/if}

{#if driver?.showConnectionField('awsRegion', $values, showConnectionFieldArgs)}
  <FormDropDownTextField
    label={_t('connectionDriverFields.awsRegion', { defaultMessage: 'AWS Region' })}
    name="awsRegion"
    data-testid="ConnectionDriverFields_awsRegion"
    menu={() => {
      return awsRegions.map(awsRegion => ({
        text: awsRegion,
        onClick: () => {
          $values = { ...$values, awsRegion };
        },
      }));
    }}
  />
{/if}

<div class="row">
  {#if driver?.showConnectionField('accessKeyId', $values, showConnectionFieldArgs)}
    <div class="col-6 mr-1">
      <FormTextField
        label={_t('connectionDriverFields.accessKeyId', { defaultMessage: 'Access Key ID' })}
        name="accessKeyId"
        disabled={isConnected || disabledFields.includes('accessKeyId')}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionDriverFields_accesKeyId"
      />
    </div>
  {/if}
  {#if driver?.showConnectionField('secretAccessKey', $values, showConnectionFieldArgs)}
    <div class="col-6 mr-1">
      <FormPasswordField
        label={_t('connectionDriverFields.secretAccessKey', { defaultMessage: 'Secret access key' })}
        name="secretAccessKey"
        disabled={isConnected || disabledFields.includes('secretAccessKey')}
        templateProps={{ noMargin: true }}
        data-testid="ConnectionDriverFields_secretAccessKey"
      />
    </div>
  {/if}
</div>

{#if !disabledFields.includes('password') && showPasswordMode}
  <FormSelectField
    label={_t('connectionDriverFields.passwordMode', { defaultMessage: 'Password mode' })}
    isNative
    name="passwordMode"
    defaultValue="saveEncrypted"
    disabled={isConnected}
    options={[
      { value: 'saveEncrypted', label: _t('connectionDriverFields.saveAndEncrypt', { defaultMessage: 'Save and encrypt' }) },
      { value: 'saveRaw', label: _t('connectionDriverFields.saveRawUnsafe', { defaultMessage: 'Save raw (UNSAFE!!)' }) },
      { value: 'askPassword', label: _t('connectionDriverFields.askForPassword', { defaultMessage: "Don't save, ask for password" }) },
      { value: 'askUser', label: _t('connectionDriverFields.askForLoginAndPassword', { defaultMessage: "Don't save, ask for login and password" }) },
    ]}
    data-testid="ConnectionDriverFields_passwordMode"
  />
{/if}

{#if driver?.showConnectionField('treeKeySeparator', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.keySeparator', { defaultMessage: 'Key separator' })}
    name="treeKeySeparator"
    disabled={isConnected}
    placeholder=":"
    data-testid="ConnectionDriverFields_treeKeySeparator"
  />
{/if}

{#if driver?.showConnectionField('windowsDomain', $values, showConnectionFieldArgs)}
  <FormTextField
    label={_t('connectionDriverFields.windowsDomain', { defaultMessage: 'Domain (specify to use NTLM authentication)' })}
    name="windowsDomain"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_windowsDomain"
  />
{/if}

{#if driver?.showConnectionField('isReadOnly', $values, showConnectionFieldArgs)}
  <FormCheckboxField
    label={_t('connectionDriverFields.isReadOnly', { defaultMessage: 'Is read only' })}
    name="isReadOnly"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_isReadOnly"
  />
{/if}

{#if driver?.showConnectionField('trustServerCertificate', $values, showConnectionFieldArgs)}
  <FormCheckboxField
    label={_t('connectionDriverFields.trustServerCertificate', { defaultMessage: 'Trust server certificate' })}
    name="trustServerCertificate"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_trustServerCertificate"
  />
{/if}

{#if driver?.showConnectionField('defaultDatabase', $values, showConnectionFieldArgs)}
  <FormDropDownTextField
    label={_t('connectionDriverFields.defaultDatabase', { defaultMessage: 'Default database' })}
    name="defaultDatabase"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_defaultDatabase"
    asyncMenu={createDatabasesMenu}
    placeholder={_t('connectionDriverFields.notSelectedOptional', { defaultMessage: '(not selected - optional)' })}
  />
{/if}

{#if defaultDatabase && driver?.showConnectionField('singleDatabase', $values, showConnectionFieldArgs)}
  <FormCheckboxField
    label={_t('connectionDriverFields.useOnlyDatabase', { defaultMessage: 'Use only database {database}', values: { database: defaultDatabase } })}
    name="singleDatabase"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_singleDatabase"
  />
{/if}

{#if driver?.showConnectionField('useSeparateSchemas', $values, showConnectionFieldArgs)}
  <FormCheckboxField
    label={_t('connectionDriverFields.useSeparateSchemas', { defaultMessage: 'Use schemas separately (use this if you have many large schemas)' })}
    name="useSeparateSchemas"
    disabled={isConnected}
    data-testid="ConnectionDriverFields_useSeparateSchemas"
  />
{/if}

{#if driver?.showConnectionField('connectionDefinition', $values, showConnectionFieldArgs)}
  <FormFileInputField disabled={isConnected} label={_t('connectionDriverFields.serviceAccountKeyJson', { defaultMessage: 'Service account key JSON' })} name="connectionDefinition" />
{/if}

{#if driver}
  <div class="row">
    <div class="col-6 mr-1">
      <FormTextField
        label={_t('connectionDriverFields.displayName', { defaultMessage: 'Display name' })}
        name="displayName"
        templateProps={{ noMargin: true }}
        disabled={isConnected}
        data-testid="ConnectionDriverFields_displayName"
        placeholder={getConnectionLabel(currentConnection)}
      />
    </div>
    <div class="col-6 mr-1">
      <FormColorField
        useSelector
        label={_t('connectionDriverFields.color', { defaultMessage: 'Color' })}
        name="connectionColor"
        emptyLabel={_t('connectionDriverFields.notSelected', { defaultMessage: '(not selected)' })}
        templateProps={{ noMargin: true }}
        disabled={isConnected}
        data-testid="ConnectionDriverFields_connectionColor"
      />
    </div>
  </div>
{/if}

<style>
  .row {
    margin: var(--dim-large-form-margin);
    display: flex;
  }
  .radio {
    margin-left: var(--dim-large-form-margin);
    display: flex;
  }
  .radio :global(label) {
    margin-right: 10px;
  }
</style>
