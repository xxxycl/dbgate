<script lang="ts">
  import _ from 'lodash';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import Link from '../elements/Link.svelte';
  import TabControl from '../elements/TabControl.svelte';
  import CheckboxField from '../forms/CheckboxField.svelte';

  import FormCheckboxField from '../forms/FormCheckboxField.svelte';
  import FormFieldTemplateLarge from '../forms/FormFieldTemplateLarge.svelte';
  import FormSelectField from '../forms/FormSelectField.svelte';
  import FormTextField from '../forms/FormTextField.svelte';
  import FormValues from '../forms/FormValues.svelte';
  import SelectField from '../forms/SelectField.svelte';
  import SettingsFormProvider from '../forms/SettingsFormProvider.svelte';
  import TextField from '../forms/TextField.svelte';
  import FontIcon from '../icons/FontIcon.svelte';

  import ModalBase from '../modals/ModalBase.svelte';
  import { closeCurrentModal, showModal } from '../modals/modalTools';
  import { EDITOR_KEYBINDINGS_MODES, EDITOR_THEMES, FONT_SIZES } from '../query/AceEditor.svelte';
  import SqlEditor from '../query/SqlEditor.svelte';
  import {
    currentEditorFontSize,
    currentEditorWrapEnabled,
    currentEditorTheme,
    currentEditorKeybindigMode,
    extensions,
    selectedWidget,
    lockedDatabaseMode,
    visibleWidgetSideBar,
    currentTheme,
    getSystemTheme,
  } from '../stores';
  import { isMac } from '../utility/common';
  import getElectron from '../utility/getElectron';
  import ThemeSkeleton from './ThemeSkeleton.svelte';
  import { isProApp } from '../utility/proTools';
  import FormTextAreaField from '../forms/FormTextAreaField.svelte';
  import { apiCall } from '../utility/api';
  import { useSettings } from '../utility/metadataLoaders';
  import { derived } from 'svelte/store';
  import { safeFormatDate } from 'dbgate-tools';
  import FormDefaultActionField from './FormDefaultActionField.svelte';
  import { _t, getSelectedLanguage } from '../translations';
  import { internalRedirectTo } from '../clientAuth';
  import ConfirmModal from '../modals/ConfirmModal.svelte';

  const electron = getElectron();
  let restartWarning = false;
  let licenseKeyCheckResult = null;

  export let selectedTab = 0;

  const sqlPreview = `-- example query
SELECT
  MAX(Album.AlbumId) AS max_album,
  MAX(Album.Title) AS max_title,
  Artist.ArtistId,
  'album' AS test_string,
  123 AS test_number
FROM
  Album
  INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId
GROUP BY
  Artist.ArtistId
ORDER BY
  Artist.Name ASC
  `;

  function openThemePlugins() {
    closeCurrentModal();
    $selectedWidget = 'plugins';
    $visibleWidgetSideBar = true;
  }

  const settings = useSettings();
  const settingsValues = derived(settings, $settings => {
    if (!$settings) {
      return {};
    }
    return $settings;
  });

  $: licenseKey = $settingsValues['other.licenseKey'];
  let checkedLicenseKey = false;
  $: if (licenseKey && !checkedLicenseKey) {
    checkedLicenseKey = true;
    apiCall('config/check-license', { licenseKey }).then(result => {
      licenseKeyCheckResult = result;
    });
  }
</script>

<SettingsFormProvider>
  <ModalBase {...$$restProps} noPadding>
    <div slot="header">{_t('settings.title', { defaultMessage: 'Settings' })}</div>

    <FormValues let:values>
      <TabControl
        bind:value={selectedTab}
        isInline
        tabs={[
          { label: _t('settings.general', { defaultMessage: 'General' }), slot: 1 },
          isProApp() && electron && { label: _t('settings.license', { defaultMessage: 'License' }), slot: 7 },
          { label: _t('settings.connection', { defaultMessage: 'Connection' }), slot: 2 },
          { label: _t('settings.themes', { defaultMessage: 'Themes' }), slot: 3 },
          { label: _t('settings.defaultActions', { defaultMessage: 'Default Actions' }), slot: 4 },
          { label: _t('settings.behaviour', { defaultMessage: 'Behaviour' }), slot: 5 },
          { label: _t('settings.externalTools', { defaultMessage: 'External tools' }), slot: 8 },
          { label: _t('settings.other', { defaultMessage: 'Other' }), slot: 6 },
        ]}
      >
        <svelte:fragment slot="1">
          {#if electron}
            <div class="heading">{_t('settings.appearance', { defaultMessage: 'Appearance' })}</div>
            <FormCheckboxField
              name="app.useNativeMenu"
              label={isMac() ? _t('settings.useNativeWindowTitle', { defaultMessage: 'Use native window title' }) : _t('settings.useSystemNativeMenu', { defaultMessage: 'Use system native menu' })}
              on:change={() => {
                restartWarning = true;
              }}
            />
            {#if restartWarning}
              <div class="ml-5 mb-3">
                <FontIcon icon="img warn" /> {_t('settings.nativeMenuRestartWarning', { defaultMessage: 'Native menu settings will be applied after app restart' })}
              </div>
            {/if}
          {/if}

          <FormCheckboxField
            name="tabGroup.showServerName"
            label={_t('settings.showServerNameInTabGroup', { defaultMessage: 'Show server name alongside database name in title of the tab group' })}
            defaultValue={false}
          />
          <div class="heading">{_t('settings.localization', { defaultMessage: 'Localization' })}</div>
          <FormSelectField
            label={_t('settings.language', { defaultMessage: 'Language' })}
            name="localization.language"
            defaultValue={getSelectedLanguage()}
            isNative
            options={[
              { value: 'en', label: 'English' },
              { value: 'cs', label: 'Czech' },
              { value: 'zh-CN', label: '简体中文' },
            ]}
            on:change={(e) => {
              const newLanguage = e.detail;
              // 通知Electron更新菜单语言
              if (electron) {
                electron.send('language-changed', newLanguage);
              }
              showModal(ConfirmModal, {
                message: _t('settings.languageReloadMessage', { defaultMessage: 'Application will be reloaded to apply new language settings' }),
                onConfirm: () => {
                  setTimeout(() => {
                    internalRedirectTo('/');
                  }, 100);
                },
              });
            }}
          />

          <div class="heading">{_t('settings.dataGrid', { defaultMessage: 'Data grid' })}</div>
          <FormTextField
            name="dataGrid.pageSize"
            label={_t('settings.dataGridPageSize', { defaultMessage: 'Page size (number of rows for incremental loading, must be between 5 and 1000)' })}
            defaultValue="100"
          />
          <FormCheckboxField name="dataGrid.showHintColumns" label={_t('settings.showForeignKeyHints', { defaultMessage: 'Show foreign key hints' })} defaultValue={true} />
          <!-- <FormCheckboxField name="dataGrid.showHintColumns" label="Show foreign key hints" defaultValue={true} /> -->

          <FormCheckboxField name="dataGrid.thousandsSeparator" label={_t('settings.useThousandsSeparator', { defaultMessage: 'Use thousands separator for numbers' })} />

          <FormTextField
            name="dataGrid.defaultAutoRefreshInterval"
            label={_t('settings.defaultAutoRefreshInterval', { defaultMessage: 'Default grid auto refresh interval in seconds' })}
            defaultValue="10"
          />

          <FormCheckboxField name="dataGrid.alignNumbersRight" label={_t('settings.alignNumbersRight', { defaultMessage: 'Align numbers to right' })} defaultValue={false} />

          <FormTextField
            name="dataGrid.collectionPageSize"
            label={_t('settings.collectionPageSize', { defaultMessage: 'Collection page size (for MongoDB JSON view, must be between 5 and 1000)' })}
            defaultValue="50"
          />

          <FormSelectField
            label={_t('settings.rowColoringMode', { defaultMessage: 'Row coloring mode' })}
            name="dataGrid.coloringMode"
            isNative
            defaultValue="36"
            options={[
              { value: '36', label: _t('settings.rowColoring.every3rd6th', { defaultMessage: 'Every 3rd and 6th row' }) },
              { value: '2-primary', label: _t('settings.rowColoring.every2ndPrimary', { defaultMessage: 'Every 2-nd row, primary color' }) },
              { value: '2-secondary', label: _t('settings.rowColoring.every2ndSecondary', { defaultMessage: 'Every 2-nd row, secondary color' }) },
              { value: 'none', label: _t('settings.rowColoring.none', { defaultMessage: 'None' }) },
            ]}
          />

          <FormCheckboxField
            name="dataGrid.showAllColumnsWhenSearch"
            label={_t('settings.showAllColumnsWhenSearch', { defaultMessage: 'Show all columns when searching' })}
            defaultValue={false}
          />

          <div class="heading">{_t('settings.sqlEditor', { defaultMessage: 'SQL editor' })}</div>

          <div class="flex">
            <div class="col-3">
              <FormSelectField
                label={_t('settings.sqlCommandsCase', { defaultMessage: 'SQL commands case' })}
                name="sqlEditor.sqlCommandsCase"
                isNative
                defaultValue="upperCase"
                options={[
                  { value: 'upperCase', label: _t('settings.sqlCase.upperCase', { defaultMessage: 'UPPER CASE' }) },
                  { value: 'lowerCase', label: _t('settings.sqlCase.lowerCase', { defaultMessage: 'lower case' }) },
                ]}
              />
            </div>
            <div class="col-3">
              <FormFieldTemplateLarge label={_t('settings.editorKeybinds', { defaultMessage: 'Editor keybinds' })} type="combo">
                <SelectField
                  isNative
                  defaultValue="default"
                  options={EDITOR_KEYBINDINGS_MODES.map(mode => ({ label: mode.label, value: mode.value }))}
                  value={$currentEditorKeybindigMode}
                  on:change={e => ($currentEditorKeybindigMode = e.detail)}
                />
              </FormFieldTemplateLarge>
            </div>
            <div class="col-3">
              <FormFieldTemplateLarge label={_t('settings.enableWordWrap', { defaultMessage: 'Enable word wrap' })} type="combo">
                <CheckboxField
                  checked={$currentEditorWrapEnabled}
                  on:change={e => ($currentEditorWrapEnabled = e.target.checked)}
                />
              </FormFieldTemplateLarge>
            </div>
          </div>

          <FormTextField
            name="sqlEditor.limitRows"
            label={_t('settings.returnOnlyNRows', { defaultMessage: 'Return only N rows from query' })}
            placeholder={_t('settings.noRowsLimit', { defaultMessage: '(No rows limit)' })}
          />

          <FormCheckboxField
            name="sqlEditor.showTableAliasesInCodeCompletion"
            label={_t('settings.showTableAliasesInCodeCompletion', { defaultMessage: 'Show table aliases in code completion' })}
            defaultValue={false}
          />

          <FormCheckboxField
            name="sqlEditor.disableSplitByEmptyLine"
            label={_t('settings.disableSplitByEmptyLine', { defaultMessage: 'Disable split by empty line' })}
            defaultValue={false}
          />
        </svelte:fragment>
        <svelte:fragment slot="2">
          <div class="heading">{_t('settings.connection', { defaultMessage: 'Connection' })}</div>

          <FormFieldTemplateLarge
            label={_t('settings.showOnlyTabsFromSelectedDatabase', { defaultMessage: 'Show only tabs from selected database' })}
            type="checkbox"
            labelProps={{
              onClick: () => {
                $lockedDatabaseMode = !$lockedDatabaseMode;
              },
            }}
          >
            <CheckboxField checked={$lockedDatabaseMode} on:change={e => ($lockedDatabaseMode = e.target.checked)} />
          </FormFieldTemplateLarge>

          <FormCheckboxField
            name="connection.autoRefresh"
            label={_t('settings.automaticRefreshDatabaseModel', { defaultMessage: 'Automatic refresh of database model on background' })}
            defaultValue={false}
          />
          <FormTextField
            name="connection.autoRefreshInterval"
            label={_t('settings.intervalBetweenAutoReloads', { defaultMessage: 'Interval between automatic DB structure reloads in seconds' })}
            defaultValue="30"
            disabled={values['connection.autoRefresh'] === false}
          />
          <FormSelectField
            label={_t('settings.localHostAddressForSSH', { defaultMessage: 'Local host address for SSH connections' })}
            name="connection.sshBindHost"
            isNative
            defaultValue="127.0.0.1"
            options={[
              { value: '127.0.0.1', label: '127.0.0.1 (IPv4)' },
              { value: '::1', label: '::1  (IPv6)' },
              { value: 'localhost', label: 'localhost (domain name)' },
            ]}
          />

          <div class="heading">{_t('settings.querySessions', { defaultMessage: 'Query sessions' })}</div>
          <FormCheckboxField
            name="session.autoClose"
            label={_t('settings.automaticCloseQuerySessions', { defaultMessage: 'Automatic close query sessions after period without any activity' })}
            defaultValue={true}
          />
          <FormTextField
            name="session.autoCloseTimeout"
            label={_t('settings.intervalAfterWhichQuerySession', { defaultMessage: 'Interval, after which query session without activity is closed (in minutes)' })}
            defaultValue="15"
            disabled={values['session.autoClose'] === false}
          />
        </svelte:fragment>

        <svelte:fragment slot="3">
          <div class="heading">{_t('settings.applicationTheme', { defaultMessage: 'Application theme' })}</div>

          <FormFieldTemplateLarge
            label={_t('settings.useSystemTheme', { defaultMessage: 'Use system theme' })}
            type="checkbox"
            labelProps={{
              onClick: () => {
                if ($currentTheme) {
                  $currentTheme = null;
                } else {
                  $currentTheme = getSystemTheme();
                }
              },
            }}
          >
            <CheckboxField
              checked={!$currentTheme}
              on:change={e => {
                if (e.target['checked']) {
                  $currentTheme = null;
                } else {
                  $currentTheme = getSystemTheme();
                }
              }}
            />
          </FormFieldTemplateLarge>

          <div class="themes">
            {#each $extensions.themes as theme}
              <ThemeSkeleton {theme} />
            {/each}
          </div>

          <div class="m-5">
            {_t('settings.moreThemesAvailable', { defaultMessage: 'More themes are available as' })} <Link onClick={openThemePlugins}>{_t('settings.plugins', { defaultMessage: 'plugins' })}</Link>
            <br />
            {_t('settings.afterInstallingThemePlugin', { defaultMessage: 'After installing theme plugin (try search "theme" in available extensions) new themes will be available here.' })}
          </div>

          <div class="heading">{_t('settings.editorTheme', { defaultMessage: 'Editor theme' })}</div>

          <div class="flex">
            <div class="col-3">
              <FormFieldTemplateLarge label={_t('settings.theme', { defaultMessage: 'Theme' })} type="combo">
                <SelectField
                  isNative
                  notSelected={_t('settings.useThemeDefault', { defaultMessage: '(use theme default)' })}
                  options={EDITOR_THEMES.map(theme => ({ label: theme, value: theme }))}
                  value={$currentEditorTheme}
                  on:change={e => ($currentEditorTheme = e.detail)}
                />
              </FormFieldTemplateLarge>
            </div>

            <div class="col-3">
              <FormFieldTemplateLarge label={_t('settings.fontSize', { defaultMessage: 'Font size' })} type="combo">
                <SelectField
                  isNative
                  notSelected={_t('settings.default', { defaultMessage: '(default)' })}
                  options={FONT_SIZES}
                  value={FONT_SIZES.find(x => x.value == $currentEditorFontSize) ? $currentEditorFontSize : 'custom'}
                  on:change={e => ($currentEditorFontSize = e.detail)}
                />
              </FormFieldTemplateLarge>
            </div>

            <div class="col-3">
              <FormFieldTemplateLarge label={_t('settings.customSize', { defaultMessage: 'Custom size' })} type="text">
                <TextField
                  value={$currentEditorFontSize == 'custom' ? '' : $currentEditorFontSize}
                  on:change={e => ($currentEditorFontSize = e.target['value'])}
                  disabled={!!FONT_SIZES.find(x => x.value == $currentEditorFontSize) &&
                    $currentEditorFontSize != 'custom'}
                />
              </FormFieldTemplateLarge>
            </div>

            <div class="col-3">
              <FormTextField name="editor.fontFamily" label={_t('settings.editorFontFamily', { defaultMessage: 'Editor font family' })} />
            </div>
          </div>

          <div class="editor">
            <SqlEditor value={sqlPreview} readOnly />
          </div>
        </svelte:fragment>
        <svelte:fragment slot="4">
          <div class="heading">{_t('settings.defaultActions', { defaultMessage: 'Default actions' })}</div>

          <FormSelectField
            label={_t('settings.connectionClick', { defaultMessage: 'Connection click' })}
            name="defaultAction.connectionClick"
            isNative
            defaultValue="connect"
            options={[
              { value: 'openDetails', label: _t('settings.editOpenDetails', { defaultMessage: 'Edit / open details' }) },
              { value: 'connect', label: _t('settings.connect', { defaultMessage: 'Connect' }) },
              { value: 'none', label: _t('settings.doNothing', { defaultMessage: 'Do nothing' }) },
            ]}
          />

          <FormSelectField
            label={_t('settings.databaseClick', { defaultMessage: 'Database click' })}
            name="defaultAction.databaseClick"
            isNative
            defaultValue="switch"
            options={[
              { value: 'switch', label: _t('settings.switchDatabase', { defaultMessage: 'Switch database' }) },
              { value: 'none', label: _t('settings.doNothing', { defaultMessage: 'Do nothing' }) },
            ]}
          />

          <FormCheckboxField name="defaultAction.useLastUsedAction" label={_t('settings.useLastUsedAction', { defaultMessage: 'Use last used action' })} defaultValue={true} />

          <FormDefaultActionField
            label={_t('settings.tableClick', { defaultMessage: 'Table click' })}
            objectTypeField="tables"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
          <FormDefaultActionField
            label={_t('settings.viewClick', { defaultMessage: 'View click' })}
            objectTypeField="views"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
          <FormDefaultActionField
            label={_t('settings.materializedViewClick', { defaultMessage: 'Materialized view click' })}
            objectTypeField="matviews"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
          <FormDefaultActionField
            label={_t('settings.procedureClick', { defaultMessage: 'Procedure click' })}
            objectTypeField="procedures"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
          <FormDefaultActionField
            label={_t('settings.functionClick', { defaultMessage: 'Function click' })}
            objectTypeField="functions"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
          <FormDefaultActionField
            label={_t('settings.nosqlCollectionClick', { defaultMessage: 'NoSQL collection click' })}
            objectTypeField="collections"
            disabled={values['defaultAction.useLastUsedAction'] !== false}
          />
        </svelte:fragment>
        <svelte:fragment slot="5">
          <div class="heading">{_t('settings.behaviour', { defaultMessage: 'Behaviour' })}</div>

          <FormCheckboxField name="behaviour.useTabPreviewMode" label={_t('settings.useTabPreviewMode', { defaultMessage: 'Use tab preview mode' })} defaultValue={true} />

          <FormCheckboxField
            name="behaviour.jsonPreviewWrap"
            label={_t('settings.behaviour.jsonPreviewWrap', { defaultMessage: 'Wrap JSON in preview' })}
            defaultValue={false}
          />

          <div class="tip">
            <FontIcon icon="img tip" /> {_t('settings.tabPreviewModeTip', {
              defaultMessage: 'When you single-click or select a file in the "Tables, Views, Functions" view, it is shown in a preview mode and reuses an existing tab (preview tab). This is useful if you are quickly browsing tables and don\'t want every visited table to have its own tab. When you start editing the table or use double-click to open the table from the "Tables" view, a new tab is dedicated to that table.'
            })}
          </div>

          <FormCheckboxField
            name="behaviour.openDetailOnArrows"
            label={_t('settings.openDetailOnKeyboardNavigation', { defaultMessage: 'Open detail on keyboard navigation' })}
            defaultValue={true}
            disabled={values['behaviour.useTabPreviewMode'] === false}
          />

          <div class="heading">{_t('settings.confirmations', { defaultMessage: 'Confirmations' })}</div>

          <FormCheckboxField name="skipConfirm.tableDataSave" label={_t('settings.skipConfirmationSavingTableData', { defaultMessage: 'Skip confirmation when saving table data (SQL)' })} />
          <FormCheckboxField
            name="skipConfirm.collectionDataSave"
            label={_t('settings.skipConfirmationSavingCollectionData', { defaultMessage: 'Skip confirmation when saving collection data (NoSQL)' })}
          />
        </svelte:fragment>
        <svelte:fragment slot="6">
          <div class="heading">{_t('settings.other', { defaultMessage: 'Other' })}</div>

          <FormTextField name="other.gistCreateToken" label={_t('settings.apiTokenForCreatingErrorGists', { defaultMessage: 'API token for creating error gists' })} defaultValue="" />

          <FormSelectField
            label={_t('settings.autoUpdateApplication', { defaultMessage: 'Auto update application' })}
            name="app.autoUpdateMode"
            isNative
            defaultValue=""
            options={[
              { value: 'skip', label: _t('settings.doNotCheckForNewVersions', { defaultMessage: 'Do not check for new versions' }) },
              { value: '', label: _t('settings.checkForNewVersions', { defaultMessage: 'Check for new versions' }) },
              { value: 'download', label: _t('settings.checkAndDownloadNewVersions', { defaultMessage: 'Check and download new versions' }) },
            ]}
          />

          {#if isProApp()}
            <FormCheckboxField
              name="ai.allowSendModels"
              label={_t('settings.allowSendDbModelsToAi', { defaultMessage: 'Allow to send DB models and query snippets to AI service' })}
              defaultValue={false}
            />
          {/if}
        </svelte:fragment>

        <svelte:fragment slot="7">
          <div class="heading">{_t('settings.license', { defaultMessage: 'License' })}</div>
          <FormTextAreaField
            name="other.licenseKey"
            label={_t('settings.licenseKey', { defaultMessage: 'License key' })}
            rows={7}
            onChange={async value => {
              licenseKeyCheckResult = await apiCall('config/check-license', { licenseKey: value });
            }}
          />
          {#if licenseKeyCheckResult}
            <div class="m-3 ml-5">
              {#if licenseKeyCheckResult.status == 'ok'}
                <div>
                  <FontIcon icon="img ok" /> {_t('settings.licenseKeyIsValid', { defaultMessage: 'License key is valid' })}
                </div>
                {#if licenseKeyCheckResult.validTo}
                  <div>
                    {_t('settings.licenseValidTo', { defaultMessage: 'License valid to:' })} {licenseKeyCheckResult.validTo}
                  </div>
                {/if}
                {#if licenseKeyCheckResult.expiration}
                  <div>{_t('settings.licenseKeyExpiration', { defaultMessage: 'License key expiration:' })} <b>{safeFormatDate(licenseKeyCheckResult.expiration)}</b></div>
                {/if}
              {:else if licenseKeyCheckResult.status == 'error'}
                <div>
                  <FontIcon icon="img error" />
                  {licenseKeyCheckResult.errorMessage ?? _t('settings.licenseKeyIsInvalid', { defaultMessage: 'License key is invalid' })}
                  {#if licenseKeyCheckResult.expiration}
                    <div>{_t('settings.licenseKeyExpiration', { defaultMessage: 'License key expiration:' })} <b>{safeFormatDate(licenseKeyCheckResult.expiration)}</b></div>
                  {/if}
                </div>
                {#if licenseKeyCheckResult.isExpired}
                  <div class="mt-2">
                    <FormStyledButton
                      value={_t('settings.checkForNewLicenseKey', { defaultMessage: 'Check for new license key' })}
                      skipWidth
                      on:click={async () => {
                        licenseKeyCheckResult = await apiCall('config/get-new-license', { oldLicenseKey: licenseKey });
                        if (licenseKeyCheckResult.licenseKey) {
                          apiCall('config/update-settings', { 'other.licenseKey': licenseKeyCheckResult.licenseKey });
                        }
                      }}
                    />
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        </svelte:fragment>

        <svelte:fragment slot="8">
          <div class="heading">{_t('settings.externalTools', { defaultMessage: 'External tools' })}</div>
          <FormTextField
            name="externalTools.mysqldump"
            label={_t('settings.mysqldumpBackupMysql', { defaultMessage: 'mysqldump (backup MySQL database)' })}
            defaultValue="mysqldump"
          />
          <FormTextField name="externalTools.mysql" label={_t('settings.mysqlRestoreMysql', { defaultMessage: 'mysql (restore MySQL database)' })} defaultValue="mysql" />
          <FormTextField
            name="externalTools.mysqlPlugins"
            label={_t('settings.folderWithMysqlPlugins', { defaultMessage: 'Folder with mysql plugins (for example for authentication). Set only in case of problems' })}
            defaultValue=""
          />
          <FormTextField
            name="externalTools.pg_dump"
            label={_t('settings.pgDumpBackupPostgresql', { defaultMessage: 'pg_dump (backup PostgreSQL database)' })}
            defaultValue="pg_dump"
          />
          <FormTextField name="externalTools.psql" label={_t('settings.psqlRestorePostgresql', { defaultMessage: 'psql (restore PostgreSQL database)' })} defaultValue="psql" />
        </svelte:fragment>
      </TabControl>
    </FormValues>

    <div slot="footer">
      <!-- <FormSubmit value="OK" on:click={handleOk} /> -->
      <FormStyledButton value={_t('settings.close', { defaultMessage: 'Close' })} on:click={closeCurrentModal} />
    </div>
  </ModalBase>
</SettingsFormProvider>

<style>
  .heading {
    font-size: 20px;
    margin: 5px;
    margin-left: var(--dim-large-form-margin);
    margin-top: var(--dim-large-form-margin);
  }

  .tip {
    margin-left: var(--dim-large-form-margin);
    margin-top: var(--dim-large-form-margin);
  }

  .themes {
    overflow-x: scroll;
    display: flex;
  }

  .editor {
    position: relative;
    height: 200px;
    width: 400px;
    margin-left: var(--dim-large-form-margin);
  }
</style>
