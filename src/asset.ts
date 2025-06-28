/**
 * Class that describes an asset file.
 *
 * @since  1.0.0
 * @access public
 */
export class Asset {
  /**
   * Name of this asset, as defined by the user in their project.
   * @since  1.0.0
   */
  name: string;
  /**
   * File type of this asset.
   * @since  1.0.0
   */
  type: string;
  /**
   * Blob representing this project. This is undefined in .aiv files as Blob
   * functions are not stringified into JSON.
   * @since  1.0.0
   */
  private readonly blob: Blob;
  /**
   * Size of this asset in bytes.
   * @since  1.0.0
   */
  size: number;
  /**
   * Temporary URL representing this blob
   * @since  1.0.0
   * @type   {String}
   */
  private url: string;

  /**
   * Creates a new AIAsset object.
   *
   * @since 1.0.0
   * @access public
   *
   * @class
   * @param {String} name The name of this asset file.
   * @param {String} type The asset's file type (png, jpg, etc.)
   * @param {Blob} blob   The blob representing this asset's contents.
   *
   * @return {Asset} New AIAsset object.
   */
  constructor(name: string, type: string, blob: Blob) {
    this.name = name;
    this.type = type;
    this.blob = blob;
    this.size = blob.size;
    this.url = "";
  }

  /**
   * Returns a unique URL that can be used to display this asset to the user.
   *
   * @since 1.0.0
   * @access public
   *
   * @return {String} Temporary URL pointing to this asset's blob.
   */
  getURL(): string {
    if (this.url === "") this.url = URL.createObjectURL(this.blob);
    return this.url;
  }

  /**
   * Revokes any URL set to point to this asset's blob.
   *
   * @since 1.0.0
   * @access public
   */
  revokeURL() {
    URL.revokeObjectURL(this.url);
  }
}
