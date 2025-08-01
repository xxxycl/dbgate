<script lang="ts" context="module">
  import registerCommand from '../commands/registerCommand';
  import { copyTextToClipboard } from '../utility/clipboard';
  import yaml from 'js-yaml';

  const getCurrentEditor = () => getActiveComponent('QueryTab');

  registerCommand({
    id: 'query.formatCode',
    category: 'Query',
    name: _t('command.query.formatCode', { defaultMessage: 'Format code' }),
    keyText: 'Shift+Alt+F',
    testEnabled: () => getCurrentEditor()?.isSqlEditor(),
    onClick: () => getCurrentEditor().formatCode(),
  });
  registerCommand({
    id: 'query.insertSqlJoin',
    category: 'Query',
    name: _t('command.query.insertSqlJoin', { defaultMessage: 'Insert SQL Join' }),
    keyText: 'CtrlOrCommand+J',
    testEnabled: () => getCurrentEditor()?.isSqlEditor(),
    onClick: () => getCurrentEditor().insertSqlJoin(),
  });
  registerCommand({
    id: 'query.toggleVisibleResultTabs',
    category: 'Query',
    name: _t('command.query.toggleVisibleResultTabs', { defaultMessage: 'Toggle visible result tabs' }),
    keyText: 'CtrlOrCommand+Shift+R',
    testEnabled: () => !!getCurrentEditor(),
    onClick: () => getCurrentEditor().toggleVisibleResultTabs(),
  });
  registerFileCommands({
    idPrefix: 'query',
    category: 'Query',
    getCurrentEditor,
    folder: 'sql',
    format: 'text',
    fileExtension: 'sql',

    execute: true,
    toggleComment: true,
    findReplace: true,
    executeAdditionalCondition: () => getCurrentEditor()?.hasConnection(),
    copyPaste: true,
  });
  registerCommand({
    id: 'query.executeCurrent',
    category: 'Query',
    name: _t('command.query.executeCurrent', { defaultMessage: 'Execute current' }),
    keyText: 'CtrlOrCommand+Shift+Enter',
    testEnabled: () =>
      getCurrentEditor() != null && !getCurrentEditor()?.isBusy() && getCurrentEditor()?.hasConnection(),
    onClick: () => getCurrentEditor().executeCurrent(),
  });
  registerCommand({
    id: 'query.toggleAutoExecute',
    category: 'Query',
    name: _t('command.query.toggleAutoExecute', { defaultMessage: 'Toggle auto execute' }),
    testEnabled: () => getCurrentEditor() != null,
    onClick: () => getCurrentEditor().toggleAutoExecute(),
  });
  registerCommand({
    id: 'query.toggleFixedConnection',
    category: 'Query',
    name: _t('command.query.toggleFixedConnection', { defaultMessage: 'Toggle fixed connection' }),
    testEnabled: () => getCurrentEditor() != null,
    onClick: () => getCurrentEditor().toggleFixedConnection(),
  });
  registerCommand({
    id: 'query.beginTransaction',
    category: 'Query',
    name: _t('command.query.beginTransaction', { defaultMessage: 'Begin transaction' }),
    icon: 'icon transaction',
    testEnabled: () => getCurrentEditor()?.beginTransactionEnabled(),
    onClick: () => getCurrentEditor().beginTransaction(),
  });
  registerCommand({
    id: 'query.autocommitOffSwitch',
    category: 'Query',
    name: _t('command.query.autocommitOff', { defaultMessage: 'Auto commit: OFF' }),
    icon: 'icon autocommit-off',
    testEnabled: () => getCurrentEditor()?.autocommitOffSwitchEnabled(),
    onClick: () => getCurrentEditor().autocommitOffSwitch(),
  });
  registerCommand({
    id: 'query.autocommitOnSwitch',
    category: 'Query',
    name: _t('command.query.autocommitOn', { defaultMessage: 'Auto commit: ON' }),
    icon: 'icon autocommit-on',
    testEnabled: () => getCurrentEditor()?.autocommitOnSwitchEnabled(),
    onClick: () => getCurrentEditor().autocommitOnSwitch(),
  });
  registerCommand({
    id: 'query.commitTransaction',
    category: 'Query',
    name: _t('command.query.commitTransaction', { defaultMessage: 'Commit transaction' }),
    toolbarName: _t('command.query.commit', { defaultMessage: 'Commit' }),
    icon: 'icon commit',
    testEnabled: () => getCurrentEditor()?.endTransactionEnabled(),
    onClick: () => getCurrentEditor().commitTransaction(),
  });
  registerCommand({
    id: 'query.rollbackTransaction',
    category: 'Query',
    name: _t('command.query.rollbackTransaction', { defaultMessage: 'Rollback transaction' }),
    toolbarName: _t('command.query.rollback', { defaultMessage: 'Rollback' }),
    icon: 'icon rollback',
    testEnabled: () => getCurrentEditor()?.endTransactionEnabled(),
    onClick: () => getCurrentEditor().rollbackTransaction(),
  });

  export const allowSwitchDatabase = props => true;
</script>

<script lang="ts">
  import { getContext, onDestroy, onMount, tick } from 'svelte';
  import sqlFormatter from 'sql-formatter';

  import VerticalSplitter from '../elements/VerticalSplitter.svelte';
  import SqlEditor from '../query/SqlEditor.svelte';
  import useEditorData from '../query/useEditorData';
  import { currentEditorWrapEnabled, extensions, getCurrentDatabase } from '../stores';
  import applyScriptTemplate from '../utility/applyScriptTemplate';
  import { changeTab, markTabUnsaved, sleep } from '../utility/common';
  import { getDatabaseInfo, useConnectionInfo, useSettings } from '../utility/metadataLoaders';
  import SocketMessageView from '../query/SocketMessageView.svelte';
  import useEffect from '../utility/useEffect';
  import ResultTabs from '../query/ResultTabs.svelte';
  import { registerFileCommands } from '../commands/stdCommands';
  import invalidateCommands from '../commands/invalidateCommands';
  import { showModal } from '../modals/modalTools';
  import InsertJoinModal from '../modals/InsertJoinModal.svelte';
  import useTimerLabel from '../utility/useTimerLabel';
  import createActivator, { getActiveComponent } from '../utility/createActivator';
  import { findEngineDriver, getSqlFrontMatter, safeJsonParse, setSqlFrontMatter } from 'dbgate-tools';
  import AceEditor from '../query/AceEditor.svelte';
  import StatusBarTabItem from '../widgets/StatusBarTabItem.svelte';
  import { showSnackbarError } from '../utility/snackbar';
  import { apiCall, apiOff, apiOn } from '../utility/api';
  import ToolStripCommandButton from '../buttons/ToolStripCommandButton.svelte';
  import ToolStripContainer from '../buttons/ToolStripContainer.svelte';
  import ToolStripExportButton, { createQuickExportHandlerRef } from '../buttons/ToolStripExportButton.svelte';
  import ToolStripSaveButton from '../buttons/ToolStripSaveButton.svelte';
  import ToolStripCommandSplitButton from '../buttons/ToolStripCommandSplitButton.svelte';
  import { getClipboardText } from '../utility/clipboard';
  import ToolStripDropDownButton from '../buttons/ToolStripDropDownButton.svelte';
  import { extractQueryParameters, replaceQueryParameters } from 'dbgate-query-splitter';
  import QueryParametersModal from '../modals/QueryParametersModal.svelte';
  import { isProApp } from '../utility/proTools';
  import { _t } from '../translations';
  import HorizontalSplitter from '../elements/HorizontalSplitter.svelte';
  import uuidv1 from 'uuid/v1';
  import ToolStripButton from '../buttons/ToolStripButton.svelte';
  import { getIntSettingsValue } from '../settings/settingsTools';
  import RowsLimitModal from '../modals/RowsLimitModal.svelte';
  import _ from 'lodash';
  import FontIcon from '../icons/FontIcon.svelte';
  import hasPermission from '../utility/hasPermission';

  export let tabid;
  export let conid;
  export let database;
  export let initialArgs;

  export const activator = createActivator('QueryTab', false);

  const QUERY_PARAMETER_STYLES = [
    {
      value: '',
      text: _t('queryTab.noParameters', { defaultMessage: '(no parameters)' }),
    },
    {
      value: '?',
      text: _t('queryTab.positionalParameters', { defaultMessage: '? (positional)' }),
    },
    {
      value: '@',
      text: _t('queryTab.atVariable', { defaultMessage: '@variable' }),
    },
    {
      value: ':',
      text: _t('queryTab.colonVariable', { defaultMessage: ':variable' }),
    },
    {
      value: '$',
      text: _t('queryTab.dollarVariable', { defaultMessage: '$variable' }),
    },
    {
      value: '#',
      text: _t('queryTab.hashVariable', { defaultMessage: '#variable' }),
    },
  ];

  const tabFocused: any = getContext('tabFocused');
  const timerLabel = useTimerLabel();

  let busy = false;
  let executeNumber = 0;
  let executeStartLine = 0;
  let visibleResultTabs = false;
  let sessionId = null;
  let resultCount;
  let errorMessages;
  let domEditor;
  let domToolStrip;
  let intervalId;
  let isInTransaction = false;
  let isAutocommit = false;
  let splitterInitialValue = undefined;
  let autoDetectCharts = false;
  let domResultTabs;

  const queryRowsLimitLocalStorageKey = `tabdata_limitRows_${tabid}`;
  function getInitialRowsLimit() {
    const storageValue = localStorage.getItem(queryRowsLimitLocalStorageKey);
    if (storageValue == 'nolimit') {
      return null;
    }
    if (storageValue) {
      return parseInt(storageValue) ?? null;
    }
    return getIntSettingsValue('sqlEditor.limitRows', null, 1);
  }

  const settingsValue = useSettings();

  let queryRowsLimit = getInitialRowsLimit();
  $: localStorage.setItem(queryRowsLimitLocalStorageKey, queryRowsLimit ? queryRowsLimit.toString() : 'nolimit');

  onMount(() => {
    intervalId = setInterval(() => {
      if (!driver?.singleConnectionOnly && sessionId) {
        apiCall('sessions/ping', {
          sesid: sessionId,
        });
      }
    }, 15 * 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  $: connection = useConnectionInfo({ conid });
  $: driver = findEngineDriver($connection, $extensions);
  $: enableWrap = $currentEditorWrapEnabled || false;

  $: effect = useEffect(() => {
    return onSession(sessionId);
  });
  function onSession(sid) {
    if (sid) {
      apiOn(`session-done-${sid}`, handleSessionDone);
      apiOn(`session-closed-${sid}`, handleSessionClosed);
      return () => {
        apiOff(`session-done-${sid}`, handleSessionDone);
        apiOff(`session-closed-${sid}`, handleSessionClosed);
      };
    }
    return () => {};
  }
  $: $effect;

  $: {
    changeTab(tabid, tab => ({ ...tab, busy }));
  }

  $: {
    busy;
    sessionId;
    isInTransaction;
    isAutocommit;
    invalidateCommands();
  }

  $: if ($tabFocused && domEditor) {
    domEditor?.getEditor()?.focus();
  }

  export function isSqlEditor() {
    return driver?.databaseEngineTypes?.includes('sql');
  }

  export function canKill() {
    return !!sessionId;
  }

  export function isBusy() {
    return busy;
  }

  export function getTabId() {
    return tabid;
  }

  export function hasConnection() {
    return !!conid && (!$connection?.isReadOnly || driver?.readOnlySessions);
  }

  export function toggleVisibleResultTabs() {
    visibleResultTabs = !visibleResultTabs;
  }

  function getParameterSplitterOptions() {
    if (!queryParameterStyle) {
      return null;
    }

    if (!driver) {
      return null;
    }

    return {
      ...driver.getQuerySplitterOptions('editor'),
      queryParameterStyle,
      allowDollarDollarString: false,
      splitByEmptyLine: !$settingsValue?.['sqlEditor.disableSplitByEmptyLine'],
    };
  }

  async function executeCore(sql, startLine = 0) {
    if (busy) return;

    const parameters = extractQueryParameters(sql, getParameterSplitterOptions());

    if (parameters.length > 0) {
      const defaultValues = {
        ...parameters.reduce((acc, x) => ({ ...acc, [x]: '' }), {}),
        ...safeJsonParse(localStorage.getItem(`tabdata_queryParams_${tabid}`)),
      };

      showModal(QueryParametersModal, {
        parameterNames: parameters,
        parameterValues: defaultValues,
        onExecute: values => {
          localStorage.setItem(`tabdata_queryParams_${tabid}`, JSON.stringify(values));
          const newSql = replaceQueryParameters(sql, values, getParameterSplitterOptions());
          executeCoreWithParams(newSql, startLine);
        },
      });
    } else {
      executeCoreWithParams(sql, startLine);
    }
  }

  async function executeCoreWithParams(sql, startLine = 0) {
    if (!sql || !sql.trim()) {
      showSnackbarError('Skipped executing empty query');
      return;
    }

    executeStartLine = startLine;
    executeNumber++;
    visibleResultTabs = true;
    const frontMatter = getSqlFrontMatter($editorValue, yaml);

    busy = true;
    timerLabel.start();

    if (driver?.singleConnectionOnly) {
      sessionId = uuidv1();
      await tick();
      await apiCall('database-connections/execute-session-query', {
        sesid: sessionId,
        conid,
        database,
        sql,
      });
    } else {
      let sesid = sessionId;
      if (!sesid) {
        const resp = await apiCall('sessions/create', {
          conid,
          database,
        });
        sesid = resp.sesid;
        sessionId = sesid;
      }
      if (driver?.implicitTransactions) {
        isInTransaction = true;
      }
      await apiCall('sessions/execute-query', {
        sesid,
        sql,
        autoCommit: driver?.implicitTransactions && isAutocommit,
        limitRows: queryRowsLimit ? queryRowsLimit : undefined,
        frontMatter,
        autoDetectCharts,
      });
    }
    await apiCall('query-history/write', {
      data: {
        sql,
        conid,
        database,
        date: new Date().getTime(),
      },
    });
  }

  async function executeControlCommand(command) {
    busy = true;
    timerLabel.start();
    visibleResultTabs = true;

    let sesid = sessionId;
    if (!sesid) {
      const resp = await apiCall('sessions/create', {
        conid,
        database,
      });
      sesid = resp.sesid;
      sessionId = sesid;
    }
    await apiCall('sessions/execute-control-command', {
      sesid,
      command,
    });
  }

  export async function executeCurrent() {
    const cmd = domEditor.getCurrentCommandText();
    await executeCore(cmd.text, cmd.line);
  }

  export async function execute() {
    const selectedText = domEditor.getEditor().getSelectedText();
    const startLine = domEditor.getEditor().getSelectionRange().start.row;
    await executeCore(selectedText || $editorValue, selectedText ? startLine : 0);
  }

  export async function kill() {
    await apiCall('sessions/kill', {
      sesid: sessionId,
    });
    sessionId = null;
    isInTransaction = false;
    busy = false;
    timerLabel.stop();
  }

  // export function getStatus() {
  //   return status;
  // }

  export function getData() {
    return $editorState.value || '';
  }

  export function toggleComment() {
    domEditor.getEditor().execCommand('togglecomment');
  }

  export function copy() {
    const selectedText = domEditor.getEditor().getSelectedText();
    copyTextToClipboard(selectedText);
  }

  export function paste() {
    getClipboardText().then(text => {
      domEditor.getEditor().execCommand('paste', text);
    });
  }

  export function find() {
    domEditor.getEditor().execCommand('find');
  }

  export function replace() {
    domEditor.getEditor().execCommand('replace');
  }

  export function formatCode() {
    const editor = domEditor.getEditor();
    editor.setValue(sqlFormatter.format(editor.getValue()));
    editor.clearSelection();
  }

  export async function insertSqlJoin() {
    const dbinfo = await getDatabaseInfo({ conid, database });
    showModal(InsertJoinModal, {
      sql: getData(),
      engine: $connection && $connection.engine,
      dbinfo,
      onInsert: text => {
        const editor = domEditor.getEditor();
        editor.session.insert(editor.getCursorPosition(), text);
        domEditor?.getEditor()?.focus();
      },
    });
  }

  export function beginTransaction() {
    isInTransaction = true;
    executeControlCommand('beginTransaction');
  }

  export function beginTransactionEnabled() {
    return driver?.supportsTransactions && !driver?.implicitTransactions && !isInTransaction && !busy;
  }

  export function autocommitOffSwitchEnabled() {
    return driver?.supportsTransactions && driver?.implicitTransactions && !isInTransaction && !busy && !isAutocommit;
  }

  export function autocommitOnSwitchEnabled() {
    return driver?.supportsTransactions && driver?.implicitTransactions && !isInTransaction && !busy && isAutocommit;
  }

  export function endTransactionEnabled() {
    return !!sessionId && driver?.supportsTransactions && isInTransaction && !busy && !isAutocommit;
  }

  export function autocommitOffSwitch() {
    isAutocommit = true;
  }

  export function autocommitOnSwitch() {
    isAutocommit = false;
  }

  export function commitTransaction() {
    isInTransaction = false;
    executeControlCommand('commitTransaction');
  }

  export function rollbackTransaction() {
    isInTransaction = false;
    executeControlCommand('rollbackTransaction');
  }

  const handleMesageClick = message => {
    // console.log('EDITOR', editorRef.current.editor);
    if (domEditor.getEditor()) {
      domEditor.getEditor().gotoLine(message.line);
    }
  };

  const handleSessionDone = () => {
    busy = false;
    if (isAutocommit) {
      isInTransaction = false;
    }
    timerLabel.stop();
  };

  const handleSessionClosed = () => {
    sessionId = null;
    handleSessionDone();
  };

  const { editorState, editorValue, setEditorData } = useEditorData({
    tabid,
    loadFromArgs:
      initialArgs && initialArgs.scriptTemplate
        ? () => applyScriptTemplate(initialArgs.scriptTemplate, $extensions, $$props)
        : null,

    onInitialData: value => {
      const frontMatter = getSqlFrontMatter(value, yaml);
      if (frontMatter?.autoExecute && hasConnection() && !isBusy()) {
        executeCore(value, 0);
      }
      if (frontMatter?.splitterInitialValue) {
        splitterInitialValue = frontMatter.splitterInitialValue;
      }
    },
  });

  function handleChangeErrors(errors) {
    errorMessages = errors;
  }

  function handleSetFrontMatterField(field, value) {
    const text = $editorValue;
    setEditorData(
      setSqlFrontMatter(
        text,
        {
          ...getSqlFrontMatter(text, yaml),
          [field]: value,
        },
        yaml
      )
    );
  }

  export function toggleAutoExecute() {
    const frontMatter = getSqlFrontMatter($editorValue, yaml);
    setEditorData(
      setSqlFrontMatter(
        $editorValue,
        { ...frontMatter, autoExecute: frontMatter?.autoExecute ? undefined : true },
        yaml
      )
    );
  }

  export function toggleFixedConnection() {
    const frontMatter = getSqlFrontMatter($editorValue, yaml);
    setEditorData(
      setSqlFrontMatter(
        $editorValue,
        frontMatter?.connectionId && frontMatter?.connectionId == conid && frontMatter?.databaseName == database
          ? { ...frontMatter, connectionId: undefined, databaseName: undefined }
          : conid
            ? { ...frontMatter, connectionId: conid, databaseName: database }
            : { ...frontMatter, connectionId: undefined, databaseName: undefined },
        yaml
      )
    );
  }

  function createMenu() {
    return [
      { command: 'query.execute' },
      { command: 'query.executeCurrent' },
      { command: 'query.kill' },
      { command: 'query.toggleAutoExecute' },
      { command: 'query.toggleFixedConnection' },
      { divider: true },
      { command: 'query.toggleComment' },
      { command: 'query.formatCode' },
      { command: 'query.insertSqlJoin' },
      { divider: true },
      { command: 'query.save' },
      { command: 'query.saveAs' },
      { divider: true },
      { command: 'query.copy' },
      { command: 'query.paste' },
      { command: 'query.find' },
      { command: 'query.replace' },
      { divider: true },
      { command: 'query.toggleVisibleResultTabs' },
    ];
  }

  const quickExportHandlerRef = createQuickExportHandlerRef();

  $: {
    conid;
    database;
    if (canKill()) {
      kill();
    }
    errorMessages = [];
  }

  let isInitialized = false;
  let queryParameterStyle =
    localStorage.getItem(`tabdata_queryParamStyle_${tabid}`) ??
    initialArgs?.queryParameterStyle ??
    (initialArgs?.scriptTemplate == 'CALL OBJECT' ? ':' : '');
</script>

<ToolStripContainer bind:this={domToolStrip}>
  <VerticalSplitter isSplitter={visibleResultTabs} initialValue={splitterInitialValue}>
    <svelte:fragment slot="1">
      {#if driver?.databaseEngineTypes?.includes('sql')}
        <SqlEditor
          engine={$connection && $connection.engine}
          {conid}
          {database}
          splitterOptions={{
            ...driver?.getQuerySplitterOptions('editor'),
            splitByEmptyLine: !$settingsValue?.['sqlEditor.disableSplitByEmptyLine'],
          }}
          options={{
            wrap: enableWrap,
          }}
          value={$editorState.value || ''}
          menu={createMenu()}
          on:input={e => {
            setEditorData(e.detail);
            if (isInitialized) {
              markTabUnsaved(tabid);
            }
            errorMessages = [];
          }}
          on:focus={() => {
            activator.activate();
            domToolStrip?.activate();
            invalidateCommands();
            setTimeout(() => {
              isInitialized = true;
            }, 100);
          }}
          bind:this={domEditor}
          onExecuteFragment={(sql, startLine) => executeCore(sql, startLine)}
          {errorMessages}
        />
      {:else}
        <AceEditor
          mode={driver?.editorMode || 'sql'}
          value={$editorState.value || ''}
          splitterOptions={{
            ...driver?.getQuerySplitterOptions('editor'),
            splitByEmptyLine: !$settingsValue?.['sqlEditor.disableSplitByEmptyLine'],
          }}
          options={{
            wrap: enableWrap,
          }}
          menu={createMenu()}
          on:input={e => setEditorData(e.detail)}
          on:focus={() => {
            activator.activate();
            domToolStrip?.activate();
            invalidateCommands();
          }}
          bind:this={domEditor}
        />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="2">
      <ResultTabs
        bind:this={domResultTabs}
        tabs={[{ label: _t('queryTab.messages', { defaultMessage: 'Messages' }), slot: 0 }]}
        {sessionId}
        {executeNumber}
        bind:resultCount
        {driver}
        onSetFrontMatterField={handleSetFrontMatterField}
        onGetFrontMatter={() => getSqlFrontMatter($editorValue, yaml)}
      >
        <svelte:fragment slot="0">
          <SocketMessageView
            eventName={sessionId ? `session-info-${sessionId}` : null}
            onMessageClick={handleMesageClick}
            {executeNumber}
            startLine={executeStartLine}
            showProcedure
            showLine
            onChangeErrors={handleChangeErrors}
          />
        </svelte:fragment>
      </ResultTabs>
    </svelte:fragment>
  </VerticalSplitter>
  <svelte:fragment slot="toolstrip">
    <ToolStripCommandSplitButton
      commands={['query.execute', 'query.executeCurrent']}
      data-testid="QueryTab_executeButton"
    />
    <ToolStripCommandButton command="query.kill" data-testid="QueryTab_killButton" />
    <ToolStripSaveButton idPrefix="query" />
    <ToolStripCommandButton command="query.formatCode" />
    {#if !driver?.singleConnectionOnly}
      <ToolStripButton
        icon="icon limit"
        on:click={() =>
          showModal(RowsLimitModal, {
            value: queryRowsLimit,
            onConfirm: value => {
              queryRowsLimit = value;
            },
          })}
      >
        {queryRowsLimit ? _t('queryTab.limitRows', { defaultMessage: 'Limit {count} rows', count: queryRowsLimit }) : _t('queryTab.unlimitedRows', { defaultMessage: 'Unlimited rows' })}</ToolStripButton
      >
    {/if}
    {#if resultCount == 1}
      <ToolStripExportButton command="jslTableGrid.export" {quickExportHandlerRef} label={_t('queryTab.exportResult', { defaultMessage: 'Export result' })} />
    {/if}
    <ToolStripDropDownButton
      menu={() =>
        QUERY_PARAMETER_STYLES.map(param => ({
          label: param.text,
          onClick: () => {
            queryParameterStyle = param.value;
            localStorage.setItem(`tabdata_queryParamStyle_${tabid}`, queryParameterStyle);
          },
        }))}
      label={QUERY_PARAMETER_STYLES.find(x => x.value == queryParameterStyle)?.text}
      icon="icon at"
      title={_t('queryTab.queryParameterStyle', { defaultMessage: 'Query parameter style' })}
    />
    <ToolStripCommandButton
      command="query.beginTransaction"
      data-testid="QueryTab_beginTransactionButton"
      hideDisabled
    />
    <ToolStripCommandButton command="query.autocommitOnSwitch" data-testid="QueryTab_autocommitOnSwitch" hideDisabled />
    <ToolStripCommandButton
      command="query.autocommitOffSwitch"
      data-testid="QueryTab_autocommitOffSwitch"
      hideDisabled
    />
    <ToolStripCommandButton
      command="query.commitTransaction"
      data-testid="QueryTab_commitTransactionButton"
      hideDisabled
    />
    <ToolStripCommandButton
      command="query.rollbackTransaction"
      data-testid="QueryTab_rollbackTransactionButton"
      hideDisabled
    />

    {#if isProApp() && visibleResultTabs && !busy && hasPermission('dbops/charts')}
      <ToolStripButton
        icon="icon chart"
        data-testid="QueryTab_openChartButton"
        on:click={() => {
          domResultTabs?.openCurrentChart();
        }}
      >
        {_t('queryTab.openChart', { defaultMessage: 'Open chart' })}</ToolStripButton
      >
    {/if}
    {#if isProApp() && !visibleResultTabs && hasPermission('dbops/charts')}
      <ToolStripButton
        icon="icon chart"
        data-testid="QueryTab_detectChartButton"
        on:click={() => {
          autoDetectCharts = !autoDetectCharts;
        }}
      >
        {_t('queryTab.detectChart', { defaultMessage: 'Detect chart' })}<FontIcon
          icon={autoDetectCharts ? 'icon checkbox-marked' : 'icon checkbox-blank'}
          padLeft
        /></ToolStripButton
      >
    {/if}
  </svelte:fragment>
</ToolStripContainer>

{#if sessionId}
  <StatusBarTabItem icon={busy ? 'icon loading' : 'icon check'} text={busy ? _t('queryTab.running', { defaultMessage: 'Running...' }) : _t('queryTab.finished', { defaultMessage: 'Finished' })} />
{/if}
