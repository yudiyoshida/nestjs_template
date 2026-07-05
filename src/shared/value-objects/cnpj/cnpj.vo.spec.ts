import { InvalidCnpjError } from './cnpj.error';
import { CNPJ } from './cnpj.vo';

describe('CNPJ Value Object', () => {
  it.each(
    [
      null,
      undefined,
      '',
      '           ',
      'invalid-cnpj',
      '11.111.1',
      '11.111.111/0001-112456',
      '11.111.111/0001-11',
      '01.234.567/0008-00',
      '37.485.252/0009-07',
      '11.111.111/1111-11',
      '47.846.258/0001-71',
      'PC3D315K000194',
      'PC3D315K0001A3',
      'PC3D315K00019@',
      '21.SKY.2A5/0001-00',
    ]
  )('should throw an error when providing invalid cnpj (%s)', (cnpj: string) => {
    // Act & Assert
    expect(() => new CNPJ(cnpj)).toThrow('CNPJ inválido');
    expect(() => new CNPJ(cnpj)).toThrow(InvalidCnpjError);
  });

  it.each(
    [
      '09.748.165/0001-10',
      '27.190.423/0001-78',
      '20.293.629/0001-84',
      '53.598.299/0001-94',
      '16.474.222/0001-86',
      'PC3D315K000193',
      'pc3d315k000193',
      '20.SKY.2A5/0001-00',
      '76.EZW.5N4/0001-30',
      'XR.H1E.ZP8/0001-18',
      'LH.GM1.VX8/0001-68',
      'LY.M8A.LEL/0001-00',
      'P3.NBL.K1K/0001-94',
      '49.XPA.LS4/0001-37',
      'TT.X79.C7L/0001-37',
      'KE.CZC.0W9/0001-90',
      'TP.L4S.A2D/0001-33',
      'CB.ZSP.GGE/0001-90',
      'NC.MKG.YPV/0001-82',
      'XH.9L6.RW8/0001-67',
      '98.4WM.LX6/0001-94',
      'LK.712.SKC/0001-66',
      'EL.PE3.398/0001-90',
      '6C.CV1.MJY/0001-31',
      '58.4DM.0PW/0001-60',
      'V0.RX7.PA5/0001-59',
      'NH.VSV.47W/0001-00',
      '3J.94T.4TD/0001-70',
      'RG.L72.C6G/0001-32',
      'J0.5TD.TNS/0001-40',
      'W3.3KR.NS6/0001-15',
      'V1.S1Y.ZYD/0001-45',
      'WX.DRM.294/0001-91',
      'HB.5KW.KKL/0001-15',
      'CW.1TS.8ZM/0001-22',
      'A4.S5M.XXK/0001-20',
      '04.MTY.T58/0001-77',
    ]
  )('should create a cnpj value object when providing valid cnpj (%s)', (cnpj: string) => {
    // Act
    const cnpjVo = new CNPJ(cnpj);

    // Assert
    expect(cnpjVo).toBeInstanceOf(CNPJ);
    expect(cnpjVo.value).toBe(cnpj.replace(/[/.-]/g, '').toUpperCase());
  });
});
