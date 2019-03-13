import React from 'react'
import { Props } from '../typings'
import { updateConfigOrProfile, formItemLayout } from '../helpers'
import WebdavModal from './WebdavModal'

import { FormComponentProps } from 'antd/lib/form'
import { Form, Switch, Checkbox } from 'antd'

export type NotebookProps = Props & FormComponentProps

export class Notebook extends React.Component<NotebookProps> {
  render () {
    const { t, config, profile } = this.props
    const { getFieldDecorator } = this.props.form

    return (
      <Form>
        <Form.Item
          {...formItemLayout}
          label={t('opt_edit_on_fav')}
          help={t('opt_edit_on_fav_help')}
        >{
          getFieldDecorator('config#editOnFav', {
            initialValue: config.editOnFav,
            valuePropName: 'checked',
          })(
            <Switch />
          )
        }</Form.Item>
        <Form.Item
          {...formItemLayout}
          label={t('opt_history')}
          help={t('opt_history_help')}
        >{
          getFieldDecorator('config#searhHistory', {
            initialValue: config.searhHistory,
            valuePropName: 'checked',
          })(
            <Switch />
          )
        }</Form.Item>
        {config.searhHistory &&
          <Form.Item
            {...formItemLayout}
            label={t('opt_history_inco')}
          >{
            getFieldDecorator('config#searhHistoryInco', {
              initialValue: config.searhHistoryInco,
              valuePropName: 'checked',
            })(
              <Switch />
            )
          }</Form.Item>
        }
        <Form.Item
          {...formItemLayout}
          label={t('opt_ctx_trans')}
          help={t('opt_ctx_trans_help')}
        >
          {Object.keys(config.ctxTrans).map(id => (
            <Form.Item key={id} style={{ marginBottom: 0 }}>{
              getFieldDecorator(`config#ctxTrans#${id}`, {
                initialValue: config.ctxTrans[id],
                valuePropName: 'checked',
              })(
                <Checkbox>{t(`dict:${id}`)}</Checkbox>
              )
            }</Form.Item>
          ))}
        </Form.Item>
        <WebdavModal {...this.props} />
      </Form>
    )
  }
}

export default Form.create({
  onFieldsChange: updateConfigOrProfile as any
})(Notebook)
