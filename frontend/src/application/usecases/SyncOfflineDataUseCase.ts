export class SyncOfflineDataUseCase {
  public static async execute(
    apiGatewayUrl: string,
    jwtToken: string
  ): Promise<{ syncedCount: number; errorsCount: number }> {
    console.log('Sincronización deshabilitada. Modo 100% online activo.');
    return { syncedCount: 0, errorsCount: 0 };
  }
}
