import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OCRConfigPanel, { OCRConfigData } from './OCRConfigPanel';

const data:OCRConfigData = { profiles:[{id:1,name:'default',default:true},{id:2,name:'UAT OCR',description:'UAT',default:false}], activeProfileId:2, categories:['engine'], parameters:[{category:'engine',name:'psm_mode',valueType:'integer',value:'3',options:['3','6']},{category:'engine',name:'user_defined_dpi',valueType:'integer',value:'300',min:72,max:600,step:10}] };

test('submits edited typed parameters',()=>{
  const onSave=jest.fn();
  render(<OCRConfigPanel data={data} onSelect={jest.fn()} onSave={onSave} onDelete={jest.fn()} onClose={jest.fn()}/>);
  fireEvent.change(screen.getByDisplayValue('3'),{target:{value:'6'}});
  fireEvent.click(screen.getByRole('button',{name:/^save$/i}));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({profileId:2,name:'UAT OCR',asNew:false,parameters:expect.arrayContaining([expect.objectContaining({name:'psm_mode',value:'6'})])}));
});

test('selects profiles and protects the default from deletion',()=>{
  const onSelect=jest.fn();
  const {rerender}=render(<OCRConfigPanel data={data} onSelect={onSelect} onSave={jest.fn()} onDelete={jest.fn()} onClose={jest.fn()}/>);
  fireEvent.change(screen.getByLabelText('Profile'),{target:{value:'1'}});
  expect(onSelect).toHaveBeenCalledWith(1);
  rerender(<OCRConfigPanel data={{...data,activeProfileId:1}} onSelect={onSelect} onSave={jest.fn()} onDelete={jest.fn()} onClose={jest.fn()}/>);
  expect(screen.getByRole('button',{name:/delete/i})).toBeDisabled();
});

test('requires a profile name',()=>{
  const onSave=jest.fn();
  render(<OCRConfigPanel data={{...data,profiles:[{...data.profiles[1],name:''}],activeProfileId:2}} onSelect={jest.fn()} onSave={onSave} onDelete={jest.fn()} onClose={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:/^save$/i}));
  expect(screen.getByText('Profile name is required.')).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});
