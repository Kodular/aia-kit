/**
 * Class that describes an asset file.
 */
export class Asset {
  /**
   * Name of this asset, as defined by the user in their project.
   */
  name: string;
  /**
   * File type of this asset.
   */
  type: string;
  /**
   * Blob representing this project. This is undefined in .aiv files as Blob
   * functions are not stringified into JSON.
   */
  private readonly blob: Blob;
  /**
   * Size of this asset in bytes.
   */
  size: number;
  /**
   * Temporary URL representing this blob
   * @type   {String}
   */
  private url: string;

  /**
   * Creates a new AIAsset object.
   *
   * @param name The name of this asset file.
   * @param type The asset's file type (png, jpg, etc.)
   * @param blob   The blob representing this asset's contents.
   *
   * @return New AIAsset object.
   */
  constructor(name: string, type: string, blob: Blob) {
    this.name = name;
    this.type = type;
    this.blob = blob;
    this.size = blob.size;
    this.url = "";
  }

  getBlob(): Blob {
    return this.blob;
  }

  /**
   * Returns a unique URL that can be used to display this asset to the user.
   *
   * @return Temporary URL pointing to this asset's blob.
   */
  getURL(): string {
    if (this.url === "") this.url = URL.createObjectURL(this.blob);
    return this.url;
  }

  /**
   * Revokes any URL set to point to this asset's blob.
   */
  revokeURL() {
    URL.revokeObjectURL(this.url);
  }
}
