import React from 'react'
import { Service, SyncConfig } from '@/background/sync-manager/services/webdav'
import { Props } from '../typings'
import { MsgSyncServiceInit, MsgType, MsgSyncServiceDownload, MsgSyncServiceUpload } from '@/typings/message'
import { message } from '@/_helpers/browser-api'
import { getSyncConfig, setSyncConfig , removeSyncConfig } from '@/background/sync-manager/helpers'
import { InputNumberGroup } from '../../InputNumberGroup'
import { formItemLayout } from '../helpers'

import { FormComponentProps } from 'antd/lib/form'
import { Form, Input, Modal, Button } from 'antd'

type SyncServiceModalProps = Props & FormComponentProps & {
  onChange: (syncConfig: SyncConfig) => void
  syncConfig: SyncConfig
}

class SyncServiceModal extends React.Component<SyncServiceModalProps> {
  render () {
    const { t, syncConfig } = this.props
    const { getFieldDecorator } = this.props.form

    const formItemLayout = {
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
    }

    return (
      <Form>
        <p dangerouslySetInnerHTML={{ __html: t('sync_webdav_explain') }} />
        <Form.Item
          {...formItemLayout}
          label={t('sync_webdav_url')}
          hasFeedback
          >{
          getFieldDecorator('url', {
            initialValue: syncConfig.url,
            rules: [{ type: 'url', message: t('sync_error_url') }]
          })(
            <Input />
          )
        }</Form.Item>
        <Form.Item
          {...formItemLayout}
          label={t('sync_webdav_user')}
        >{
          getFieldDecorator('user', {
            initialValue: syncConfig.user,
          })(
            <Input />
          )
        }</Form.Item>
        <Form.Item
          {...formItemLayout}
          label={t('sync_webdav_passwd')}
        >{
          getFieldDecorator('passwd', {
            initialValue: syncConfig.passwd,
          })(
            <Input type='password' />
          )
        }</Form.Item>
        <Form.Item
          {...formItemLayout}
          label={t('sync_webdav_duration')}
          extra={t('sync_webdav_duration_help')}
        >{
          getFieldDecorator('duration', {
            initialValue: syncConfig.duration,
            rules: [{ type: 'number', whitespace: true }],
          })(
            <InputNumberGroup suffix={t('common:unit_mins')} />
          )
        }</Form.Item>
      </Form>
    )
  }
}

const SyncServiceModalForm = Form.create<SyncServiceModalProps>({
  onValuesChange (props, changedFields, allValues) {
    props.onChange(allValues)
  },
})(SyncServiceModal)

export type WebdavModalProps = Props & FormComponentProps

export class WebdavModal extends React.Component<WebdavModalProps> {
  isSyncServiceTainted = false

  state = {
    isSyncServiceLoading: false,
    syncServiceConfig: null as null | SyncConfig,
  }

  openSyncService = async () => {
    this.setState({
      syncServiceConfig: (
        (await getSyncConfig<SyncConfig>(Service.id)) || Service.getDefaultConfig()
      )
    })
  }

  closeSyncService = () => {
    if (!this.isSyncServiceTainted ||
      confirm(this.props.t('sync_close_confirm'))
    ) {
      this.setState({ syncServiceConfig: null })
      this.isSyncServiceTainted = false
    }
  }

  saveSyncService = async () => {
    const { t } = this.props
    const { syncServiceConfig } = this.state
    if (!syncServiceConfig) { return }

    this.setState({ isSyncServiceLoading: true })

    const response = await message.send<MsgSyncServiceInit>({
      type: MsgType.SyncServiceInit,
      serviceID: Service.id,
      config: syncServiceConfig,
    }).catch(() => ({}))
    const error = response && response.error
    if (error && error !== 'exist') {
      if (/^(network|unauthorized|mkcol|parse)$/.test(error)) {
        alert(t('sync_webdav_err_' + error))
      } else {
        alert(t('sync_webdav_err_unknown', { error }))
      }
      this.setState({ isSyncServiceLoading: false })
      return
    }

    await setSyncConfig(Service.id, syncServiceConfig)

    if (error === 'exist') {
      if (confirm(t('sync_webdav_err_exist'))) {
        await message.send<MsgSyncServiceDownload>({
          type: MsgType.SyncServiceDownload,
          serviceID: Service.id,
          noCache: true,
        })
        .catch(() => ({ error: 'unknown' }))
        .then(e => {
          if (e && e.error) {
            alert(t('sync_webdav_err_network'))
          }
        })
      }
    }

    await message.send<MsgSyncServiceUpload>({
      type: MsgType.SyncServiceUpload,
      serviceID: Service.id,
      force: true,
    })
    .catch(() => ({ error: 'unknown' }))
    .then(e => {
      if (e && e.error) {
        alert(t('sync_webdav_err_network'))
      }
    })

    this.setState({
      isSyncServiceLoading: false,
      syncServiceConfig: null,
    })
    this.isSyncServiceTainted = false
  }

  clearSyncService = async () => {
    if (confirm(this.props.t('sync_delete_confirm'))) {
      await removeSyncConfig(Service.id)
      this.setState({ syncServiceConfig: null })
      this.isSyncServiceTainted = false
    }
  }

  onSyncServiceChange = (newSyncConfig: SyncConfig) => {
    this.isSyncServiceTainted = true
    this.setState({ syncServiceConfig: newSyncConfig })
    console.log(newSyncConfig)
  }

  render () {
    const { t, config, profile } = this.props
    const { syncServiceConfig } = this.state

    return (
      <>
        <Form.Item
          {...formItemLayout}
          label={t('opt_sync_btn')}
        >
          <Button onClick={this.openSyncService}>{t('opt_sync_btn')}</Button>
        </Form.Item>
        <Modal
          visible={!!syncServiceConfig}
          title={t('sync_notebook_title')}
          destroyOnClose
          onOk={this.saveSyncService}
          onCancel={this.closeSyncService}
          footer={[
            <Button
              key='delete'
              type='danger'
              onClick={this.clearSyncService}
            >{t('common:delete')}</Button>,
            <Button
              key='save'
              type='primary'
              loading={this.state.isSyncServiceLoading}
              onClick={this.saveSyncService}
            >{t('common:save')}</Button>,
            <Button
              key='cancel'
              onClick={this.closeSyncService}
            >{t('common:cancel')}</Button>,
          ]}
        >{
          React.createElement(SyncServiceModalForm, {
            t, config, profile,
            onChange: this.onSyncServiceChange,
            syncConfig: syncServiceConfig as SyncConfig,
          })
        }</Modal>
      </>
    )
  }
}

export default WebdavModal
